"use client"

import * as React from "react"
import { Mic, ShieldCheck } from "lucide-react"
import { Session } from "@/lib/mock-store"

interface AudioPlaybackProps {
  session: Session
}

export function AudioPlayback({ session }: AudioPlaybackProps) {
  // Use a placeholder if audioUrl is missing but session exists
  const audioSrc = session.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

  return (
    <div className="space-y-8 py-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
          <Mic className="size-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Consultation Recording</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This audio is the source for the current transcription and clinical notes.
          </p>
        </div>

        <audio 
          controls 
          src={audioSrc} 
          className="w-full mt-4 h-11"
        >
          Your browser does not support the audio element.
        </audio>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-medium uppercase tracking-wider">
          <ShieldCheck className="size-4" />
          Stored securely with end-to-end encryption
        </div>
      </div>
    </div>
  )
}
