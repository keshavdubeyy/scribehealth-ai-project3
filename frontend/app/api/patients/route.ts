import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
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

  if (!body.name || !body.age || !body.gender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const id       = Math.random().toString(36).substring(7)
  const supabase = createServiceClient()
  const { error } = await supabase.from("patients").insert({
    id,
    doctor_email:       doctorEmail,
    organization_id:    orgId ?? null,
    name:               body.name,
    age:                body.age,
    gender:             body.gender,
    email:              body.email              ?? null,
    phone:              body.phone              ?? null,
    chronic_conditions: body.chronicConditions  ?? null,
    allergies:          body.allergies           ?? null,
    emergency_contact:  body.emergencyContact    ?? null,
    insurance_details:  body.insuranceDetails    ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id })
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
