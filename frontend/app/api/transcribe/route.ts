import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createServiceClient } from "@/utils/supabase/service"
import { TranscriptionServiceFactory } from "@/lib/transcription-factory"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData  = await req.formData()
  const audio     = formData.get("audio")     as File | null
  const sessionId = formData.get("sessionId") as string | null

  if (!audio) return NextResponse.json({ error: "No audio file provided" }, { status: 400 })

  const audioBuffer = Buffer.from(await audio.arrayBuffer())

  // Upload to Supabase Storage (best-effort — transcription continues even if storage fails)
  let audioUrl: string | null = null
  if (sessionId) {
    try {
      const supabase    = createServiceClient()
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

  // Transcribe via the factory-created provider (currently Sarvam; swap via TRANSCRIPTION_PROVIDER env var)
  let provider
  try {
    provider = TranscriptionServiceFactory.create()
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription provider not configured" },
      { status: 500 },
    )
  }

  const transcript = await provider.transcribe(audioBuffer, audio.type || "audio/webm")

  return NextResponse.json({ transcript, audioUrl })
}
