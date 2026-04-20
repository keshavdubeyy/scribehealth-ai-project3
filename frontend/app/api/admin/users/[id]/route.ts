import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params // user's email
  const body = await req.json()
  const { name, role, active } = body

  const updateData: Record<string, unknown> = {}
  if (name   !== undefined) updateData.name      = name
  if (role   !== undefined) updateData.role      = role
  if (active !== undefined) updateData.is_active = active

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("email", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id:             data.email,
    name:           data.name,
    email:          data.email,
    role:           data.role,
    active:         data.is_active,
    organizationId: data.organization_id,
    createdAt:      data.created_at,
  })
}
