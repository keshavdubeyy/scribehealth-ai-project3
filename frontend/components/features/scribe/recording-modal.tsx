"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, Pause, Square, Loader2, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: (audioData: string) => void // Mock audio data
}

export function RecordingModal({ isOpen, onClose, onRecordingComplete }: RecordingModalProps) {
  const [step, setStep] = useState<"COUNTDOWN" | "RECORDING" | "PAUSED">("COUNTDOWN")
  const [countdown, setCountdown] = useState(3)
  const [duration, setDuration] = useState(0)

  // Countdown Logic
  useEffect(() => {
    if (isOpen && step === "COUNTDOWN") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        setStep("RECORDING")
      }
    }
  }, [isOpen, countdown, step])

  // Timer Logic
  useEffect(() => {
    if (step === "RECORDING") {
      const timer = setInterval(() => setDuration((d) => d + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [step])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleStop = () => {
    // Simulate audio data completion
    onRecordingComplete("mock_audio_protocol_data")
    // Reset state for next time
    setStep("COUNTDOWN")
    setCountdown(3)
    setDuration(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-0 h-0 overflow-hidden">
           <DialogTitle>Consultation Recording Phase</DialogTitle>
           <DialogDescription>Capture and provision clinical audio transmission.</DialogDescription>
        </DialogHeader>
        <div className="p-8 flex flex-col items-center justify-center min-h-[350px] gap-8">
          {step === "COUNTDOWN" ? (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
               <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-primary/20">
                  <span className="text-4xl font-black italic">{countdown}</span>
               </div>
               <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">Initializing Protocol</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Stand by for clinical audio capture</p>
               </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-10 animate-in fade-in duration-300">
               <div className="relative">
                  <div className={cn(
                    "size-32 rounded-full flex items-center justify-center transition-all duration-500",
                    step === "RECORDING" ? "bg-primary/10 scale-110" : "bg-slate-200 scale-100"
                  )}>
                    <Mic className={cn("size-10", step === "RECORDING" ? "text-primary animate-pulse" : "text-slate-400")} />
                  </div>
                  {step === "RECORDING" && (
                    <div className="absolute inset-0 size-32 rounded-full border-2 border-primary animate-ping opacity-20" />
                  )}
               </div>

               <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-3xl font-mono font-black tracking-tighter text-slate-900">
                     <div className={cn("size-2 rounded-full bg-primary", step === "RECORDING" ? "animate-pulse" : "opacity-0")} />
                     {formatTime(duration)}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Capturing Live consultation</p>
               </div>

               <div className="flex items-center gap-4 w-full px-6">
                  {step === "RECORDING" ? (
                    <Button 
                      onClick={() => setStep("PAUSED")} 
                      variant="outline" 
                      className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px] gap-2 border-slate-200"
                    >
                      <Pause className="size-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setStep("RECORDING")} 
                      className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px] gap-2"
                    >
                      <Mic className="size-4" />
                      Resume
                    </Button>
                  )}
                  <Button 
                    onClick={handleStop} 
                    variant="destructive" 
                    className="flex-1 rounded-2xl h-14 font-bold uppercase tracking-widest text-[10px] gap-2"
                  >
                    <Square className="size-4 fill-current" />
                    Finish
                  </Button>
               </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
               <Volume2 className="size-3 text-slate-400" />
               <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/20 w-1/3 animate-pulse" />
               </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
