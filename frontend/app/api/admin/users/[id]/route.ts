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

  const { active } = await req.json()

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("email", decodeURIComponent(id))
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "User not found with matching email" }, { status: 404 })
  }

  // Log the administrative action
  await logAuditServer(
    session.user?.email ?? "system",
    active ? "user_activated" : "user_deactivated",
    "profile",
    decodeURIComponent(id),
    { 
      targetEmail: decodeURIComponent(id), 
      active,
      initiator: session.user?.email 
    }
  )

  return NextResponse.json({ message: "User status updated", userId: id })
}
