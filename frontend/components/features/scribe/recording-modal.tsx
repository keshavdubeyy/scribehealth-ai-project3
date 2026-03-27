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
import { Mic, Pause, Square, Volume2 } from "lucide-react"
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
      <DialogContent className="sm:max-w-md rounded-none border-border p-0 overflow-hidden bg-background shadow-none">
        <DialogHeader className="p-0 h-0 overflow-hidden">
           <DialogTitle>Consultation Recording Phase</DialogTitle>
           <DialogDescription>Capture and provision clinical audio transmission.</DialogDescription>
        </DialogHeader>
        <div className="p-10 flex flex-col items-center justify-center min-h-[400px] gap-10">
          {step === "COUNTDOWN" ? (
            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
               <div className="size-32 bg-muted/20 border border-primary/20 flex items-center justify-center text-primary group relative">
                  <span className="text-5xl font-black italic">{countdown}</span>
                  <div className="absolute inset-x-0 -bottom-2 h-0.5 bg-primary/20 animate-pulse" />
               </div>
               <div className="text-center space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Initializing Protocol</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground italic opacity-50">Synchronizing Clinical Stream</p>
               </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-12 animate-in fade-in duration-500">
               <div className="relative">
                  <div className={cn(
                    "size-40 border transition-all duration-700 flex items-center justify-center",
                    step === "RECORDING" ? "border-primary bg-primary/5 scale-105" : "border-border bg-muted/20 scale-100"
                  )}>
                    <Mic className={cn("size-12", step === "RECORDING" ? "text-primary animate-pulse" : "text-muted-foreground")} />
                  </div>
                  {step === "RECORDING" && (
                    <div className="absolute inset-0 size-40 border border-primary animate-ping opacity-10" />
                  )}
               </div>

               <div className="text-center space-y-4 w-full">
                  <div className="flex items-center justify-center gap-4 text-4xl font-mono font-black tracking-tighter text-foreground">
                     <div className={cn("size-2 bg-primary", step === "RECORDING" ? "animate-pulse" : "opacity-0")} />
                     {formatTime(duration)}
                  </div>
                  <div className="flex justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-40">Capturing Live consultation</span>
                  </div>
               </div>

               <div className="flex items-center gap-4 w-full">
                  {step === "RECORDING" ? (
                    <Button 
                      onClick={() => setStep("PAUSED")} 
                      variant="outline" 
                      className="flex-1 rounded-none h-14 font-black uppercase tracking-widest text-[10px] gap-3 border-border shadow-none"
                    >
                      <Pause className="size-4" />
                      Pause Protocol
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setStep("RECORDING")} 
                      className="flex-1 rounded-none h-14 font-black uppercase tracking-widest text-[10px] gap-3 shadow-none"
                    >
                      <Mic className="size-4" />
                      Resume Stream
                    </Button>
                  )}
                  <Button 
                    onClick={handleStop} 
                    variant="destructive" 
                    className="flex-1 rounded-none h-14 font-black uppercase tracking-widest text-[10px] gap-3 shadow-none"
                  >
                    <Square className="size-4 fill-current" />
                    Terminate
                  </Button>
               </div>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 p-6 border-t border-border">
            <div className="flex items-center gap-4">
               <Volume2 className="size-4 text-muted-foreground/30" />
               <div className="flex-1 h-0.5 bg-border relative overflow-hidden">
                  <div className="absolute inset-y-0 bg-primary/40 w-1/3 animate-progress" />
               </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
