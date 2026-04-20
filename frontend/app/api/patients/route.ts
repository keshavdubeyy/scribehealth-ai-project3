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

  const { name, age, gender, patientEmail, phone } = await req.json() as {
    name: string
    age: number
    gender: string
    patientEmail?: string
    phone?: string
  }

  if (!name || !age || !gender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const id = Math.random().toString(36).substring(7)
  const supabase = createServiceClient()
  const { error } = await supabase.from("patients").insert({
    id,
    doctor_email: email,
    organization_id: orgId,
    name,
    age,
    gender,
    email: patientEmail ?? null,
    phone: phone ?? null,
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
