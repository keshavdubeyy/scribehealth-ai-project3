import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) return NextResponse.json({ error: "SARVAM_API_KEY not configured" }, { status: 500 })

  const formData = await req.formData()
  const audio     = formData.get("audio")     as File | null
  const sessionId = formData.get("sessionId") as string | null

  if (!audio) return NextResponse.json({ error: "No audio file provided" }, { status: 400 })

  const audioBuffer = Buffer.from(await audio.arrayBuffer())

  // Upload to Supabase Storage (best-effort — transcription continues even if storage fails)
  let audioUrl: string | null = null
  if (sessionId) {
    try {
      const supabase = createServiceClient()
      const storagePath = `${session.user?.email ?? "unknown"}/${sessionId}.webm`
      const { error: uploadError } = await supabase.storage
        .from("sessions")
        .upload(storagePath, audioBuffer, { contentType: "audio/webm", upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from("sessions").getPublicUrl(storagePath)
        audioUrl = data.publicUrl
      }
    } catch { /* storage failure is non-fatal */ }
  }

  // Transcribe via Sarvam
  const sarvamForm = new FormData()
  sarvamForm.append("file", new File([audioBuffer], "recording.webm", { type: "audio/webm" }))
  sarvamForm.append("model", "saarika:v2.5")

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body: sarvamForm,
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Sarvam error: ${text}` }, { status: 500 })
  }

  const data = await res.json()
  const transcript: string = data.transcript ?? ""

  return NextResponse.json({ transcript, audioUrl })
}
