import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { mode, name, email, password, organizationName, organizationType, inviteCode, specialization } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 })
  }

  const supabase = createServiceClient()
  let organizationId: string | null = null
  let role = "DOCTOR"

  if (mode === "create_org") {
    if (!organizationName) {
      return NextResponse.json({ message: "Organization name is required." }, { status: 400 })
    }

    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("name", organizationName)
      .maybeSingle()

    if (existingOrg) {
      return NextResponse.json({ message: "An organization with that name already exists." }, { status: 409 })
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: organizationName, type: organizationType || "clinic", is_active: true })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ message: orgError.message }, { status: 500 })
    }

    organizationId = org.id
    role = "ADMIN"

  } else if (mode === "join_org") {
    if (!inviteCode) {
      return NextResponse.json({ message: "Invite code is required." }, { status: 400 })
    }

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("organization_id, status")
      .eq("email", `invite_${inviteCode.toUpperCase()}`)
      .maybeSingle()

    if (inviteError || !invite || invite.status !== "PENDING") {
      return NextResponse.json({ message: "Invalid or expired invite code." }, { status: 400 })
    }

    organizationId = invite.organization_id
    role = "DOCTOR"
  } else {
    return NextResponse.json({ message: "Invalid registration mode." }, { status: 400 })
  }

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (authError) {
    if (mode === "create_org" && organizationId) {
      await supabase.from("organizations").delete().eq("id", organizationId)
    }
    return NextResponse.json({ message: authError.message }, { status: 400 })
  }

  // Create profile row
  const { error: profError } = await supabase.from("profiles").insert({
    email,
    name,
    role,
    organization_id: organizationId,
    specialization:  specialization || null,
    is_active:       true,
  })

  if (profError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    if (mode === "create_org" && organizationId) {
      await supabase.from("organizations").delete().eq("id", organizationId)
    }
    return NextResponse.json({ message: profError.message }, { status: 500 })
  }

  // Mark invite as used
  if (mode === "join_org") {
    await supabase
      .from("invites")
      .update({ status: "USED" })
      .eq("email", `invite_${inviteCode.toUpperCase()}`)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
