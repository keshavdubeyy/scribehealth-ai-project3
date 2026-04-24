import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

function normalizeUser(u: any) {
  return {
    id:             u.email,
    name:           u.name,
    email:          u.email,
    role:           u.role,
    active:         u.is_active,
    organizationId: u.organization_id,
    createdAt:      u.created_at,
    specialization: u.specialization,
    licenseNumber:  u.license_number,
  }
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", session.user.organizationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map(normalizeUser))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, email: rawEmail, password, role: rawRole, specialization, licenseNumber } = await req.json()
  const email = (rawEmail as string)?.toLowerCase()

  const supabase = createServiceClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { data: profile, error: profError } = await supabase
    .from("profiles")
    .insert({
      email,
      name,
      role:            rawRole === "ADMIN" ? "ADMIN" : "DOCTOR",
      organization_id: session.user.organizationId,
      specialization:  specialization || null,
      license_number:  licenseNumber  || null,
      is_active:       true,
    })
    .select()
    .single()

  if (profError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profError.message }, { status: 500 })
  }

  return NextResponse.json(normalizeUser(profile))
}
