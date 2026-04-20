import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { code } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from("invites")
    .update({ status: "EXPIRED" })
    .eq("email", `invite_${code}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
