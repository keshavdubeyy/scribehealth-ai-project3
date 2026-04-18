"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Session, useScribeStore } from "@/lib/mock-store"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TranscriptPanelProps {
  session: Session
}

export function TranscriptPanel({ session }: TranscriptPanelProps) {
  const router = useRouter()
  const { updateSession } = useScribeStore()
  const [isTranscribing, setIsTranscribing] = React.useState(false)
  const hasAudio = !!session.audioUrl
  const hasTranscript = !!session.transcription

  const handleTranscribe = async () => {
    setIsTranscribing(true)
    try {
      await new Promise(r => setTimeout(r, 3000))
      await updateSession(session.id, {
        transcription: "Patient: Doctor, I've been having a fever for three days now, along with a sore throat and mild cough.\n\nDoctor: I see. Any chills or body aches?\n\nPatient: Yes, some body aches, but the fever is the main concern. It gets quite high in the evenings.\n\nDoctor: Let me examine you. Your throat looks inflamed. Based on the examination, this appears to be a bacterial throat infection. I'll prescribe antibiotics for five days along with a fever reducer as needed.",
      })
      toast.success("Transcript ready")
      router.refresh()
    } catch {
      toast.error("Transcription failed")
    } finally {
      setIsTranscribing(false)
    }
  }

  // Path A — no transcript
  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {hasAudio
            ? "Audio was recorded but transcription hasn't run yet."
            : "No audio or transcript available for this session."}
        </p>
        {hasAudio && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Transcribe now</>
            }
          </Button>
        )}
      </div>
    )
  }

  // Path B — transcript exists
  return (
    <div className="space-y-3">
      {hasAudio && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Re-transcribe</>
            }
          </Button>
        </div>
      )}
      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
        {session.transcription}
      </pre>
    </div>
  )
}
