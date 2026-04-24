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
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(Number(searchParams.get("limit")  ?? 100), 5000)
  const offset = Number(searchParams.get("offset") ?? 0)

  const supabase = createServiceClient()
  let query = supabase.from("audit_logs").select()

  if (orgId) {
    // Standard org-restricted admin
    const { data: orgUsers } = await supabase
      .from("profiles")
      .select("email")
      .eq("organization_id", orgId)
    
    const userEmails = orgUsers?.map(u => u.email).filter(Boolean) ?? []
    
    // Inclusion: Logs for this org OR logs by its members (even if un-tagged)
    if (userEmails.length > 0) {
      // Escape emails to prevent injection/syntax errors in .in()
      const escapedEmails = userEmails.map(e => `"${e}"`).join(",")
      query = query.or(`organization_id.eq.${orgId},user_email.in.(${escapedEmails})`)
    } else {
      query = query.eq("organization_id", orgId)
    }
  } else {
    // Global admin / No org assigned — see everything
  }

  const { data, error } = await query
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
  // No org check — allow logs without organization association

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
