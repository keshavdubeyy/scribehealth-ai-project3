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
    const { data: orgUsers } = await supabase
      .from("profiles")
      .select("email")
      .eq("organization_id", orgId)
    
    const userEmails = orgUsers?.map(u => u.email).filter(Boolean) ?? []
    const escapedEmails = userEmails.map(e => `"${e}"`).join(",")

    // Forceful fallback: If audit_logs table is missing organization_id col, fall back to email list
    // We try the email list first as it is more likely to exist.
    if (userEmails.length > 0) {
      try {
        // We attempt the cross-join filter
        query = query.or(`organization_id.eq.${orgId},user_email.in.(${escapedEmails})`)
      } catch {
        // Fallback to email only if column is missing
        query = query.in("user_email", userEmails)
      }
    } else {
      query = query.eq("organization_id", orgId)
    }
  }

  // Final validation: Sort and fetch
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  // If the first query failed because of missing organization_id column, try one last time with just user_email
  if (error?.message?.includes("organization_id")) {
    const { data: retryData, error: retryError } = await supabase
      .from("audit_logs")
      .select()
      .in("user_email", orgId ? (await supabase.from("profiles").select("email").eq("organization_id", orgId)).data?.map(u => u.email).filter(Boolean) ?? [] : [])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 })
    return NextResponse.json({ logs: retryData ?? [] })
  }

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
