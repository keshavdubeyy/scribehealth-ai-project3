"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Mic, Square, Loader2, ShieldCheck, Info } from "lucide-react"
import { toast } from "sonner"
import { useScribeStore } from "@/lib/mock-store"

type Step = "consent" | "recording" | "processing"

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
  onSessionReady: (sessionId: string) => void
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

export function RecordingModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSessionReady,
}: RecordingModalProps) {
  const { addSession, updateSession } = useScribeStore()

  const [step, setStep]                   = React.useState<Step>("consent")
  const [consented, setConsented]         = React.useState(false)
  const [elapsed, setElapsed]             = React.useState(0)
  const [processingStatus, setProcessing] = React.useState("")

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef        = React.useRef<Blob[]>([])
  const streamRef        = React.useRef<MediaStream | null>(null)
  const startTimeRef     = React.useRef<Date | null>(null)
  const timerRef         = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep("consent")
      setConsented(false)
      setElapsed(0)
      chunksRef.current = []
    }
  }, [isOpen])

  // Timer while recording
  React.useEffect(() => {
    if (step === "recording") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    onClose()
  }

  // ── Consent confirmed → request mic → start recording ──────────────────────
  const handleConsentConfirmed = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast.error("Microphone access denied. Please allow microphone access and try again.")
      return
    }
    streamRef.current = stream

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm"

    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start(1000)

    mediaRecorderRef.current = recorder
    startTimeRef.current = new Date()
    setStep("recording")
  }

  // ── End session → process ──────────────────────────────────────────────────
  const handleStop = React.useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    setStep("processing")
    if (timerRef.current) clearInterval(timerRef.current)

    // Stop recorder and wait for all chunks
    recorder.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    await new Promise<void>(resolve => { recorder.onstop = () => resolve() })

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })

    // Create session in DB
    let sessionId: string
    try {
      sessionId = await addSession(patientId)
      await updateSession(sessionId, { status: "PROCESSING" })
    } catch (err) {
      toast.error("Failed to create session. Please try again.")
      setStep("consent")
      return
    }

    // Transcribe
    setProcessing("Transcribing audio…")
    let transcript = ""
    try {
      const fd = new FormData()
      fd.append("audio", new File([audioBlob], "recording.webm", { type: "audio/webm" }))
      fd.append("sessionId", sessionId)
      const res = await fetch("/api/transcribe", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "Transcription failed")
      const transcribeData = await res.json()
      transcript = transcribeData.transcript
      if (transcribeData.audioUrl) {
        await updateSession(sessionId, { audioUrl: transcribeData.audioUrl })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed")
      await updateSession(sessionId, { status: "IDLE" })
      setStep("consent")
      return
    }

    // Generate note
    setProcessing("Generating clinical note…")
    try {
      const res = await fetch("/api/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Note generation failed")
      const { note } = await res.json() as {
        note: Record<string, string>
        template: string
        patientName: string | null
        patientAge: number | null
      }
      await updateSession(sessionId, {
        soap:          note,
        transcription: transcript,
        status:        "COMPLETED",
      })
    } catch (err) {
      // Note generation failed — transcript is saved, user can regenerate from session page
      await updateSession(sessionId, { transcription: transcript, status: "IDLE" })
      toast.error("Note generation failed. Transcript saved — you can generate the note from the session page.", {
        duration: 6000,
      })
    }

    onSessionReady(sessionId)
  }, [patientId, addSession, updateSession, onSessionReady])

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-0 h-0 overflow-hidden">
          <DialogTitle>New session</DialogTitle>
          <DialogDescription>Record and transcribe a patient consultation.</DialogDescription>
        </DialogHeader>

        {/* ── CONSENT ── */}
        {step === "consent" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Before you begin</p>
                <p className="text-xs text-muted-foreground">Patient consent is required</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 border p-4 space-y-2.5">
              <p className="text-sm font-medium">Please inform your patient that:</p>
              <ul className="space-y-2">
                {[
                  "This session will be recorded",
                  "Audio is used only to generate clinical notes",
                  "Recording is processed securely and not shared with third parties",
                  "Patient can request deletion of their recording at any time",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consented}
                onCheckedChange={v => setConsented(!!v)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
                I have informed my patient about the recording and they have given verbal consent to proceed
              </Label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!consented}
              onClick={handleConsentConfirmed}
            >
              Start recording
            </Button>
          </div>
        )}

        {/* ── RECORDING ── */}
        {step === "recording" && (
          <div className="p-8 flex flex-col items-center gap-8">
            {/* Fixed top bar */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2.5
              bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              Recording in progress
              <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
            </div>

            <div className="pt-8 flex flex-col items-center gap-6 w-full">
              <div className="relative">
                <div className="w-32 h-32 border border-primary bg-primary/5 flex items-center justify-center">
                  <Mic className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 border border-primary animate-ping opacity-10 pointer-events-none" />
              </div>

              <div className="text-center space-y-1">
                {patientName && (
                  <p className="text-sm font-medium">{patientName}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Proceed with your consultation as usual
                </p>
              </div>

              <Button
                variant="destructive"
                size="lg"
                className="w-full gap-2"
                onClick={handleStop}
              >
                <Square className="w-4 h-4 fill-current" />
                End session
              </Button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-sm">{processingStatus}</p>
              <p className="text-xs text-muted-foreground">This takes about 15–30 seconds</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
