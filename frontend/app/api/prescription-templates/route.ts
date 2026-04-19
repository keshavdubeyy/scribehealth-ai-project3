import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("prescription_templates")
    .select()
    .eq("doctor_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ template: null })

  const sz = data.safe_zone as Record<string, number>
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return NextResponse.json({
    template: {
      id:          data.id,
      imagePath:   data.image_path,
      imageUrl:    `${supabaseUrl}/storage/v1/object/public/prescription-templates/${data.image_path}`,
      imageWidth:  data.image_width,
      imageHeight: data.image_height,
      safeZone: {
        xPct:         sz.x_pct,
        yPct:         sz.y_pct,
        widthPct:     sz.width_pct,
        heightPct:    sz.height_pct,
        fontSizePt:   sz.font_size_pt,
        lineHeightPt: sz.line_height_pt,
      },
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user?.email
  if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

  const formData  = await req.formData()
  const imageFile = formData.get("image") as File | null
  const metaRaw   = formData.get("meta") as string | null

  if (!imageFile) return NextResponse.json({ error: "No image provided" }, { status: 400 })
  if (!metaRaw)   return NextResponse.json({ error: "No metadata provided" }, { status: 400 })

  let meta: { imageWidth: number; imageHeight: number; safeZone: Record<string, number> }
  try { meta = JSON.parse(metaRaw) } catch {
    return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 })
  }

  const ext     = imageFile.type === "image/png" ? "png" : "jpg"
  const fileName = `${email.replace(/[@.]/g, "_")}/${Date.now()}.${ext}`

  const supabase    = createServiceClient()
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from("prescription-templates")
    .upload(fileName, imageBuffer, { contentType: imageFile.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Delete any previous template rows for this user (one template per doctor)
  await supabase.from("prescription_templates").delete().eq("doctor_email", email)

  const { data, error: insertError } = await supabase
    .from("prescription_templates")
    .insert({
      doctor_email:   email,
      image_path:   fileName,
      image_width:  meta.imageWidth,
      image_height: meta.imageHeight,
      safe_zone: {
        x_pct:          meta.safeZone.xPct,
        y_pct:          meta.safeZone.yPct,
        width_pct:      meta.safeZone.widthPct,
        height_pct:     meta.safeZone.heightPct,
        font_size_pt:   meta.safeZone.fontSizePt,
        line_height_pt: meta.safeZone.lineHeightPt,
      },
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return NextResponse.json({
    template: {
      id:          data.id,
      imagePath:   data.image_path,
      imageUrl:    `${supabaseUrl}/storage/v1/object/public/prescription-templates/${data.image_path}`,
      imageWidth:  data.image_width,
      imageHeight: data.image_height,
      safeZone:    meta.safeZone,
    },
  })
}
