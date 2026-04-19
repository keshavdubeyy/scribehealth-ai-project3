import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const { to, subject, body, event } = await req.json() as {
    to: string
    subject: string
    body: string
    event: string
  }

  if (!to || !subject || !event) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Log the notification to audit_logs as the system record of the send.
  // In production, replace this with a real email service call (Resend, SES, etc.).
  const supabase = createServiceClient()
  const { error } = await supabase.from("audit_logs").insert({
    user_email:  email,
    action:      "notification_sent",
    entity_type: "notification",
    entity_id:   event,
    metadata:    { to, subject, channel: "email" },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
