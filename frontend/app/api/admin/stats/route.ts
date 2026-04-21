import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const supabase = createServiceClient()

  const [{ data: profiles }, { data: org }] = await Promise.all([
    supabase.from("profiles").select("role, is_active").eq("organization_id", orgId),
    supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
  ])

  const list = profiles ?? []
  return NextResponse.json({
    totalUsers:       list.length,
    totalDoctors:     list.filter(p => p.role === "DOCTOR").length,
    totalAdmins:      list.filter(p => p.role === "ADMIN").length,
    activeUsers:      list.filter(p => p.is_active).length,
    pendingUsers:     list.filter(p => !p.is_active).length,
    organizationName: org?.name ?? null,
  })
}
