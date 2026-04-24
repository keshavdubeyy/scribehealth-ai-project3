import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
import type { ChronicCondition, Allergy, EmergencyContact, InsuranceDetails } from "@/lib/mock-store"

export const runtime = "nodejs"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctorEmail = session.user?.email
  if (!doctorEmail) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const body = await req.json() as {
    email?: string
    phone?: string
    chronicConditions?: ChronicCondition[]
    allergies?: Allergy[]
    emergencyContact?: EmergencyContact
    insuranceDetails?: InsuranceDetails
  }

  const updates: Record<string, unknown> = {}
  if (body.email             !== undefined) updates.email              = body.email
  if (body.phone             !== undefined) updates.phone              = body.phone
  if (body.chronicConditions !== undefined) updates.chronic_conditions = body.chronicConditions
  if (body.allergies         !== undefined) updates.allergies          = body.allergies
  if (body.emergencyContact  !== undefined) updates.emergency_contact  = body.emergencyContact
  if (body.insuranceDetails  !== undefined) updates.insurance_details  = body.insuranceDetails

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", params.id)
    .eq("doctor_email", doctorEmail)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
