import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user?.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(Number(searchParams.get("limit")  ?? 100), 5000)
  const offset = Number(searchParams.get("offset") ?? 0)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .select()
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const orgId = session.user?.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { action, entityType, entityId, metadata } = await req.json() as {
    action: string
    entityType: string
    entityId: string
    metadata?: Record<string, unknown>
  }

  if (!action || !entityType || !entityId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("audit_logs").insert({
    user_email:      email,
    action,
    entity_type:     entityType,
    entity_id:       entityId,
    metadata:        metadata ?? {},
    organization_id: orgId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
