import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
import { logAuditServer } from "@/lib/audit-server"

export const runtime = "nodejs"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { active, role } = await req.json()

  const supabase = createServiceClient()
  const updates: Record<string, any> = {}
  if (active !== undefined) updates.is_active = active
  if (role !== undefined)   updates.role      = role

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const userEmail = decodeURIComponent(id)
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("email", userEmail)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "User not found with matching email" }, { status: 404 })
  }

  // Log the administrative action(s)
  if (active !== undefined) {
    await logAuditServer(
      session.user?.email ?? "system",
      active ? "user_activated" : "user_deactivated",
      "profile",
      userEmail,
      { targetEmail: userEmail, active, initiator: session.user?.email }
    )
  }
  if (role !== undefined) {
    await logAuditServer(
      session.user?.email ?? "system",
      "role_updated",
      "profile",
      userEmail,
      { targetEmail: userEmail, newRole: role, initiator: session.user?.email }
    )
  }

  // Helper to match the normalization in the GET/POST routes
  const normalizeUser = (u: any) => ({
    id:             u.email,
    name:           u.name,
    email:          u.email,
    role:           u.role,
    active:         u.is_active,
    organizationId: u.organization_id,
    createdAt:      u.created_at,
    specialization: u.specialization,
    licenseNumber:  u.license_number,
  })

  return NextResponse.json(normalizeUser(data[0]))
}
