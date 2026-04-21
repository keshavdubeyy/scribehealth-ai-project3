import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("invites")
    .insert({
      email: `invite_${code}`, // Use code as PK or have a separate PK. Scheme says email is primary key.
      organization_id: orgId,
      status: "PENDING"
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Transform to match legacy frontend expectation
  return NextResponse.json({
    id: data.email,
    code: code,
    isActive: true,
    isUsable: true,
    createdAt: data.created_at
  })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Handle revoke
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("invites")
    .update({ status: "EXPIRED" })
    .eq("email", `invite_${code}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
