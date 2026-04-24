import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, organization_id, name, organizations(name)")
    .eq("email", session.user.email)
    .maybeSingle()

  if (error || !profile) {
    return NextResponse.json({ role: "DOCTOR", organizationId: null, organizationName: null, name: session.user.name })
  }

  return NextResponse.json({
    role:             profile.role,
    organizationId:   profile.organization_id,
    organizationName: (profile as any).organizations?.name ?? null,
    name:             profile.name,
  })
}
