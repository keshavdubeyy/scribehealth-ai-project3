import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export const runtime = "nodejs"
export const maxDuration = 30

interface Medicine {
  name: string
  dose: string
  frequency: string
  duration: string
  timing: string
}

interface GenerateRequest {
  templateId: string
  patientName: string
  age: string
  dateStr: string
  reasonForVisit: string
  whatsWrong: string
  medicines: Medicine[]
  nextSteps: string[]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as GenerateRequest

  const supabase = createServiceClient()

  // Fetch template row
  const { data: tmpl, error: tmplError } = await supabase
    .from("prescription_templates")
    .select()
    .eq("id", body.templateId)
    .single()

  if (tmplError || !tmpl) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  // Download letterhead image from Supabase Storage
  const { data: imgData, error: imgError } = await supabase.storage
    .from("prescription-templates")
    .download(tmpl.image_path)

  if (imgError || !imgData) {
    return NextResponse.json({ error: "Failed to download letterhead image" }, { status: 500 })
  }

  const imgBuffer = Buffer.from(await imgData.arrayBuffer())

  // Determine PDF page size: A4 width, height proportional to image aspect ratio
  const A4_WIDTH_PT = 595.28
  const aspectRatio = tmpl.image_height / tmpl.image_width
  const pageHeight  = A4_WIDTH_PT * aspectRatio

  const pdfDoc = await PDFDocument.create()
  const page   = pdfDoc.addPage([A4_WIDTH_PT, pageHeight])

  // Embed letterhead
  const isJpeg   = tmpl.image_path.endsWith(".jpg") || tmpl.image_path.endsWith(".jpeg")
  const embedded = isJpeg
    ? await pdfDoc.embedJpg(imgBuffer)
    : await pdfDoc.embedPng(imgBuffer)

  page.drawImage(embedded, { x: 0, y: 0, width: A4_WIDTH_PT, height: pageHeight })

  // Safe zone coordinates (percentage → points)
  const sz = tmpl.safe_zone as Record<string, number>
  const zoneX      = sz.x_pct      * A4_WIDTH_PT
  const zoneY      = sz.y_pct      * pageHeight
  const zoneWidth  = sz.width_pct  * A4_WIDTH_PT
  const zoneHeight = sz.height_pct * pageHeight
  const fontSizePt    = sz.font_size_pt   ?? 10
  const lineHeightPt  = sz.line_height_pt ?? 16

  // PDF coordinate system: origin at bottom-left, y increases upward
  // Convert: pdfY = pageHeight - imageY - zoneHeight
  const pdfZoneTop = pageHeight - zoneY

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Build text lines
  const lines: Array<{ text: string; bold: boolean; indent: number }> = []

  lines.push({ text: `${body.patientName}   Age: ${body.age}   ${body.dateStr}`, bold: true, indent: 0 })
  if (body.reasonForVisit) lines.push({ text: `Reason for visit: ${body.reasonForVisit}`, bold: false, indent: 0 })
  lines.push({ text: "", bold: false, indent: 0 })

  if (body.whatsWrong) {
    lines.push({ text: "What's wrong:", bold: true, indent: 0 })
    // Word-wrap whatsWrong
    const words = body.whatsWrong.split(" ")
    let line = ""
    const maxChars = Math.floor(zoneWidth / (fontSizePt * 0.55))
    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        lines.push({ text: line.trim(), bold: false, indent: 8 })
        line = w
      } else {
        line = (line + " " + w).trim()
      }
    }
    if (line) lines.push({ text: line, bold: false, indent: 8 })
    lines.push({ text: "", bold: false, indent: 0 })
  }

  if (body.medicines.length > 0) {
    lines.push({ text: "Medicines:", bold: true, indent: 0 })
    body.medicines.forEach((med, i) => {
      lines.push({ text: `${i + 1}. ${med.name}`, bold: false, indent: 4 })
      const detail = [med.dose, med.frequency, med.duration, med.timing ? `(${med.timing})` : ""]
        .filter(Boolean).join("  ·  ")
      lines.push({ text: detail, bold: false, indent: 12 })
    })
    lines.push({ text: "", bold: false, indent: 0 })
  }

  if (body.nextSteps.filter(Boolean).length > 0) {
    lines.push({ text: "What to do next:", bold: true, indent: 0 })
    body.nextSteps.filter(Boolean).forEach(step => {
      lines.push({ text: `• ${step}`, bold: false, indent: 4 })
    })
  }

  // Draw lines top-to-bottom within safe zone
  let cursorY = pdfZoneTop - lineHeightPt
  for (const line of lines) {
    if (!line.text) { cursorY -= lineHeightPt * 0.5; continue }
    if (cursorY < pageHeight - zoneY - zoneHeight) break

    page.drawText(line.text, {
      x:    zoneX + line.indent,
      y:    cursorY,
      size: fontSizePt,
      font: line.bold ? fontBold : fontRegular,
      color: rgb(0, 0, 0),
      maxWidth: zoneWidth - line.indent,
    })
    cursorY -= lineHeightPt
  }

  const pdfBytes = Buffer.from(await pdfDoc.save())

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="prescription_${body.patientName.replace(/\s+/g, "_")}.pdf"`,
    },
  })
}
