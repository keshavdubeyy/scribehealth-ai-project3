import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
import { PatientProfileBuilder, PatientProfileValidationError } from "@/lib/patient-profile-builder"
import type { ChronicCondition, Allergy, EmergencyContact, InsuranceDetails } from "@/lib/mock-store"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctorEmail = session.user?.email
  const orgId       = session.user?.organizationId
  if (!doctorEmail) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const body = await req.json() as {
    name: string
    age: number
    gender: string
    email?: string
    phone?: string
    chronicConditions?: ChronicCondition[]
    allergies?: Allergy[]
    emergencyContact?: EmergencyContact
    insuranceDetails?: InsuranceDetails
  }

  try {
    const builder = new PatientProfileBuilder(body.name, body.age, body.gender)
    if (body.email)             builder.withEmail(body.email)
    if (body.phone)             builder.withPhone(body.phone)
    if (body.chronicConditions) builder.withChronicConditions(body.chronicConditions)
    if (body.allergies)         builder.withAllergies(body.allergies)
    if (body.emergencyContact)  builder.withEmergencyContact(body.emergencyContact)
    if (body.insuranceDetails)  builder.withInsurance(body.insuranceDetails)

    const profile = builder.build()

    const id       = Math.random().toString(36).substring(7)
    const supabase = createServiceClient()
    const { error } = await supabase.from("patients").insert({
      id,
      doctor_email:       doctorEmail,
      organization_id:    orgId ?? null,
      name:               profile.name,
      age:                profile.age,
      gender:             profile.gender,
      email:              profile.email              ?? null,
      phone:              profile.phone              ?? null,
      chronic_conditions: profile.chronicConditions  ?? null,
      allergies:          profile.allergies           ?? null,
      emergency_contact:  profile.emergencyContact    ?? null,
      insurance_details:  profile.insuranceDetails    ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id })

  } catch (err) {
    if (err instanceof PatientProfileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    throw err
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: "Missing patient id" }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("doctor_email", email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
