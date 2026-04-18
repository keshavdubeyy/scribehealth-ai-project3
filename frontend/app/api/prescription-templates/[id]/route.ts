import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { safeZone: Record<string, number> }
  if (!body.safeZone) return NextResponse.json({ error: "No safeZone provided" }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("prescription_templates")
    .update({
      safe_zone: {
        x_pct:          body.safeZone.xPct,
        y_pct:          body.safeZone.yPct,
        width_pct:      body.safeZone.widthPct,
        height_pct:     body.safeZone.heightPct,
        font_size_pt:   body.safeZone.fontSizePt,
        line_height_pt: body.safeZone.lineHeightPt,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Fetch to get image_path for storage cleanup
  const { data } = await supabase
    .from("prescription_templates")
    .select("image_path")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase.from("prescription_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.image_path) {
    await supabase.storage.from("prescription-templates").remove([data.image_path])
  }

  return NextResponse.json({ ok: true })
}
