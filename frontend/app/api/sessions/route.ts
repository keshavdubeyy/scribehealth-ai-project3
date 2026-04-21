import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  const orgId = session.user?.organizationId
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const { patientId } = await req.json() as { patientId: string }
  if (!patientId) return NextResponse.json({ error: "Missing patientId" }, { status: 400 })

  const id = Math.random().toString(36).substring(7)
  const createdAt = new Date().toISOString()
  const supabase = createServiceClient()
  const { error } = await supabase.from("sessions").insert({
    id,
    patient_id:      patientId,
    doctor_email:    email,
    organization_id: orgId,
    created_at:      createdAt,
    status:          "SCHEDULED",
    edits:           [],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id, createdAt })
}
