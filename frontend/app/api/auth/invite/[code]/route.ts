import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = createServiceClient()

  const { data: invite } = await supabase
    .from("invites")
    .select("organization_id, status, organizations(name, type)")
    .eq("email", `invite_${code.toUpperCase()}`)
    .maybeSingle()

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ valid: false })
  }

  const org = invite.organizations as any
  return NextResponse.json({
    valid:            true,
    organizationId:   invite.organization_id,
    organizationName: org?.name   ?? null,
    organizationType: org?.type   ?? null,
  })
}
