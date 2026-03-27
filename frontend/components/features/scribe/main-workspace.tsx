"use client"

import * as React from "react"
import {
  Calendar,
  ChevronDown,
  Globe,
  Mic,
  MoreHorizontal,
  Plus,
  Trash2,
  Clock,
  AudioLines,
  Undo2,
  Redo2,
  Copy,
  ChevronRight,
  Sparkle,
  ListFilter,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BottomBar } from "@/components/features/scribe/bottom-bar"
import { cn } from "@/lib/utils"

import { useScribeContext } from "@/context/scribe-context"
import { Loader2 } from "lucide-react"

import { CreatePatientForm } from "./create-patient-form"

export function MainWorkspace() {
  const scribe = useScribeContext()
  const { patients, selectedPatient, sessions, activeSession, transcription, note, prescriptions, startSession } = scribe

  // Case 1: No Patients
  if (patients.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Create your first patient</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">You need at least one patient record to start a consultation session.</p>
        </div>
        <CreatePatientForm onSuccess={() => scribe.fetchPatients()} />
      </div>
    )
  }

  // Case 2: Selected Patient, No Sessions
  if (selectedPatient && sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background">
        <div className="size-16 rounded-lg bg-primary/5 flex items-center justify-center mb-6 border border-primary/20">
          <Calendar size={28} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Start a new consultation</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">No medical history found for {selectedPatient.name}. Start a new session to begin scribing.</p>
        <Button onClick={() => startSession(selectedPatient.id)} className="bg-primary text-primary-foreground font-bold h-11 px-8">
          <Plus size={18} className="mr-2" />
          New Session
        </Button>
      </div>
    )
  }

  // No active session selected but sessions exist
  if (!activeSession && sessions.length > 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background">
        <div className="size-12 rounded-full border border-muted-foreground/20 flex items-center justify-center mb-4">
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select a session from the list to view details</p>
      </div>
    )
  }

  // If we reach here, we have an activeSession
  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <WorkspaceHeader />
      <div className="flex-1 overflow-auto p-6 scrollbar-hide">
        {/* State Based Content rendering */}
        <WorkspaceContent />
      </div>
      <BottomBar />
    </div>
  )
}

function WorkspaceHeader() {
  const { activeSession, selectedPatient } = useScribeContext()

  return (
    <div className="p-6 pb-2 space-y-4 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center border border-border rounded-full hover:bg-accent transition-colors">
            <AudioLines size={14} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{selectedPatient?.name || "Session"}</h2>
          <Badge variant="outline" className="ml-2 text-[10px] font-bold uppercase py-0 px-2 opacity-50">{activeSession?.status}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="bg-muted/80 hover:bg-muted text-muted-foreground font-bold h-9 gap-2 shadow-none border border-border" disabled>
            <Plus size={16} />
            Create
          </Button>
          <div className="flex items-center overflow-hidden rounded-md border border-primary/20 bg-primary h-9 shadow-sm">
            <Button className="rounded-none h-full px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none">
              <AudioLines size={16} />
              {activeSession?.status === "RECORDING" ? "Stop Recording" : "Transcribe"}
            </Button>
            <div className="w-[1px] h-2/3 bg-background/20" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-none h-full w-8 bg-primary hover:bg-primary/90 text-primary-foreground hover:text-primary-foreground shadow-none">
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border shadow-2xl rounded-md min-w-[180px]">
                <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                  <AudioLines size={14} />
                  Start transcribing
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                  <Mic size={14} />
                  Dictating
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-accent/50 text-[10px]">
            <Calendar size={12} />
            <span>{new Date(activeSession?.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-accent/50 text-[10px]">
            <Globe size={12} />
            <span>English</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-accent/50 text-[10px]">
            <Clock size={12} />
            <span>00:00</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-accent/50 text-[10px]">
            <Mic size={12} />
            <span className="truncate max-w-[140px]">Default Input</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceContent() {
  const { activeSession, transcription, note } = useScribeContext()

  // Case 3: Session = idle
  if (activeSession.status === "IDLE") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-70">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse mb-2">
          <Mic size={24} />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">Start recording</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">Begin the consultation audio recording to generate structured SOAP notes.</p>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold mt-4 h-11 px-8 rounded-full shadow-lg">
          <AudioLines size={18} className="mr-2" />
          Start Recording
        </Button>
      </div>
    )
  }

  // Case 4: Session = recording
  if (activeSession.status === "RECORDING") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="size-3 bg-red-500 rounded-full animate-ping" />
          <span className="text-2xl font-mono font-bold">00:15 / 05:00</span>
        </div>
        <div className="w-[400px] h-32 bg-accent/50 rounded-xl overflow-hidden relative border border-border/50 flex items-center justify-center gap-1 px-8">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="w-[3px] bg-primary/40 rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
        </div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Recording patient visit...</p>
        <Button variant="destructive" className="font-bold h-11 px-8 rounded-full shadow-xl">
          Stop Recording
        </Button>
      </div>
    )
  }

  // Case 5: Session = processing
  if (activeSession.status === "PROCESSING") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Loader2 size={32} className="text-primary animate-spin mb-2" />
        <h3 className="text-xl font-bold tracking-tight text-foreground">Generating transcription...</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">AI is processing the clinical audio. Structured clinical notes will appear soon.</p>
      </div>
    )
  }

  // Transition to Transcription / SOAP logic
  return (
    <div className="space-y-12 pb-24">
      {/* Case 6: Transcription exists vs missing */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Transcription</h4>
        {transcription ? (
          <p className="text-sm text-foreground leading-relaxed transition-all duration-700 animate-in fade-in slide-in-from-top-2">{transcription.processedText || transcription.rawText}</p>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-xl opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Empty transcription panel</p>
          </div>
        )}
      </section>

      {/* Case 7/8: Clinical Note (SOAP) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clinical Note (SOAP)</h4>
          {!note && transcription && (
            <Button variant="outline" size="sm" className="h-7 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold px-3">
              Generate clinical notes
            </Button>
          )}
        </div>

        {note ? (
          <div className="space-y-8 transition-all animate-in fade-in duration-1000">
            {[
              { label: "Subjective", val: note.subjective },
              { label: "Objective", val: note.objective },
              { label: "Assessment", val: note.assessment },
              { label: "Plan", val: note.plan }
            ].map(soap => (
              <div key={soap.label} className="space-y-3">
                <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider">{soap.label}</h5>
                <p className="text-sm text-foreground leading-relaxed bg-accent/30 p-4 rounded-lg border border-border/30">{soap.val}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-xl opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generate clinical notes once transcription is available</p>
          </div>
        )}
      </section>

      {/* Case 9: Prescriptions */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prescriptions</h4>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 px-2">
            <Plus size={14} className="mr-1" /> Add medication
          </Button>
        </div>
        {/* Show prescriptions here... */}
      </section>
    </div>
  )
}

function RefreshCw({ size, className }: { size: number, className?: string }) {
  return <AudioLines size={size} className={cn("-rotate-45", className)} />
}

function LayoutGrid({ size, className }: { size: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-0.5 border border-current rounded-sm p-0.5", className)}>
      <div className="w-1 h-1 bg-current" />
      <div className="w-1 h-1 bg-current" />
      <div className="w-1 h-1 bg-current" />
      <div className="w-1 h-1 bg-current" />
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("mx-1", className)} />
}
