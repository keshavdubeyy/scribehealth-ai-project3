import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const organizationId = session.user?.organizationId
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 })
  }

  try {
    const { getDoctorStatsLogic } = await import("@/lib/services/doctor-stats")
    const result = await getDoctorStatsLogic(organizationId)
    return NextResponse.json({ doctors: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
