"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, FileText, Activity, MessageSquare, Loader2, Sparkles, Wand2, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SessionPage() {
  const { patientId, sessionId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getPatient, getSessions, updateSession, deleteSession } = useScribeStore()

  const [mounted, setMounted] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  
  // SOAP State
  const [soap, setSoap] = React.useState({
    s: "",
    o: "",
    a: "",
    p: ""
  })

  const [transcription, setTranscription] = React.useState("")

  const patient = React.useMemo(() => mounted ? getPatient(patientId as string) : null, [patientId, getPatient, mounted])
  const sessions = React.useMemo(() => mounted ? getSessions(patientId as string) : [], [patientId, getSessions, mounted])
  const session = React.useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId])

  React.useEffect(() => {
    setMounted(true)
    
    // Load existing data if available
    if (session) {
       setSoap(session.soap || { s: "", o: "", a: "", p: "" })
       setTranscription(session.transcription || "")
    }

    const hasAudio = searchParams.get("audio")
    if (hasAudio && !session?.transcription) {
      setIsProcessing(true)
      const timer = setTimeout(async () => {
        setIsProcessing(false)
        const mockTranscript = "Patient presenting with severe lower back pain radiating to the right leg for 3 days. Occurred after lifting heavy boxes. No history of trauma. Physical exam shows tenderness in L4-L5 region. Strength 5/5 bilaterally. Recommended rest, heat therapy, and ibuprofen 400mg tid."
        const mockSoap = {
          s: "Severe lower back pain radiating to right leg (3 days). Onset after lifting heavy objects.",
          o: "Tenderness localized to L4-L5 paraspinal muscles. Normal motor strength (5/5).",
          a: "Acute lumbar strain with possible early sciatica.",
          p: "Rest for 48h. Heat application. Ibuprofen 400mg TID. Follow up if symptoms persist beyond 1 week."
        }
        setTranscription(mockTranscript)
        setSoap(mockSoap)
        
        // Auto-save the processed result
        try {
          await updateSession(sessionId as string, { 
            status: "COMPLETED", 
            transcription: mockTranscript,
            soap: mockSoap
          })
          toast.success("Consultation transmission processed and archived.")
        } catch (err) {
          toast.error("Auto-archive failed. Please save manually.")
        }
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, mounted, sessionId, session])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSession(sessionId as string, { soap, transcription, status: "COMPLETED" })
      toast.success("Consultation protocols synchronized successfully.")
    } catch (err) {
      toast.error("Protocol synchronization failed. Check clinical connection.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmPurge = async () => {
    setIsDeleting(true)
    try {
      await deleteSession(sessionId as string)
      toast.success("Session purged from clinical records.")
      router.push(`/patients/${patientId}`)
    } catch (err) {
      toast.error("Purge operation failed.")
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  if (!mounted) return null

  if (!patient || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
        <div className="flex flex-col items-center text-center gap-4 animate-in fade-in duration-700">
           <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive font-black uppercase tracking-[0.3em] text-[10px]">
             Session Context Invalid
           </div>
           <h2 className="text-2xl font-black uppercase tracking-tighter">Session Not Detected</h2>
           <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest max-w-[200px]">The requested clinical session record does not exist in the active index.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/patients/${patientId}`)} className="font-black uppercase tracking-widest text-[10px] h-11 px-8">
          Return to Patient
        </Button>
      </div>
    )
  }

  const sessionIndex = sessions.length - sessions.findIndex(s => s.id === sessionId)

  return (
    <div className="relative min-h-screen">
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase tracking-widest text-lg font-black">Purge Active Session</AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase tracking-[0.15em] font-medium leading-relaxed">
              Are you sure you want to delete this consultation and all generated SOAP documentation? This action is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase tracking-widest text-[10px]">Cancel Protocol</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleConfirmPurge()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive font-black uppercase tracking-widest text-[10px]"
            >
               {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8 animate-in fade-in duration-700">
           <div className="relative">
              <div className="size-32 border border-primary/20 flex items-center justify-center rotate-45 animate-pulse">
                 <Wand2 className="size-10 text-primary -rotate-45" />
              </div>
              <div className="absolute inset-x-0 -bottom-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
           </div>
           <div className="text-center space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-4">
                Converting <span className="text-primary italic">Transmission</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Neural Transcription Service Active</p>
           </div>
           
           <div className="w-80 h-px bg-border group relative">
              <div className="absolute inset-y-0 h-full bg-primary animate-progress" style={{ width: '40%' }} />
           </div>
        </div>
      )}

      <div className="space-y-12 max-w-6xl mx-auto pb-20">
        {/* Header / Workflow Controls */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border -mx-8 px-8 py-8 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => router.push(`/patients/${patient.id}`)}
              className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all w-fit group"
            >
              <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
              Patient Protocol Index
            </button>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-widest flex items-center gap-3">
               <span className="text-muted-foreground/30">{patient.name}</span>
               <span className="size-1.5 bg-primary/20 mt-1" />
               <span className="text-primary italic">Session {sessionIndex}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary border border-primary/20 px-4 py-2 bg-primary/5 uppercase">
                {isProcessing ? "PROCESSING" : session.status}
              </span>
              <Button onClick={handleSave} disabled={isSaving || isProcessing} className="font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-none gap-3">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Synchronize Records
              </Button>
              <Button onClick={() => setIsConfirmOpen(true)} variant="ghost" className="font-black uppercase tracking-widest text-[10px] h-12 px-6 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="size-4 mr-3" />
                Purge
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main SOAP Workspace */}
          <div className="lg:col-span-7 space-y-10 animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                <div className="size-10 bg-muted/20 border border-border flex items-center justify-center text-primary">
                   <FileText className="size-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Clinical Documentation (SOAP)</h2>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Standardized Medical Protocol</span>
                </div>
            </div>

            <div className="grid gap-10">
                {[
                  { label: "S - Subjective", key: "s", placeholder: "PATIENT COMPLAINTS & SYMPTOMS..." },
                  { label: "O - Objective", key: "o", placeholder: "CLINICAL OBSERVATIONS & VITALS..." },
                  { label: "A - Assessment", key: "a", placeholder: "DX & DIFFERENTIAL CLINICAL HYPOTHESIS..." },
                  { label: "P - Plan", key: "p", placeholder: "TX PROTOCOL & FOLLOW-UP ACTIONS..." }
                ].map((section) => (
                  <div key={section.key} className="space-y-3 group">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
                        {section.label}
                      </label>
                      {isProcessing && <div className="size-1.5 bg-primary animate-pulse" />}
                    </div>
                    <Textarea 
                      value={soap[section.key as keyof typeof soap]}
                      onChange={(e) => setSoap({...soap, [section.key]: e.target.value})}
                      placeholder={section.placeholder}
                      className={cn(
                        "min-h-[140px] rounded-none border-border bg-muted/5 focus-visible:ring-0 focus-visible:border-primary transition-all text-xs font-medium leading-relaxed p-6 uppercase shadow-none",
                        isProcessing && "opacity-20 translate-y-2"
                      )}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Sidebar Transcription Display */}
          <div className="lg:col-span-5 space-y-10">
            <div className="flex items-center gap-4">
                <div className="size-10 bg-muted/20 border border-border flex items-center justify-center text-primary">
                   <Activity className="size-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Real-time Transmission Index</h2>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Captured Clinical Stream</span>
                </div>
            </div>

            <div className={cn(
              "h-full min-h-[600px] flex flex-col p-10 border border-border bg-muted/5 transition-all duration-700 relative overflow-hidden",
              transcription ? "bg-background" : "border-dashed"
            )}>
              {!transcription ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-20 px-4">
                  <div className="size-16 bg-background border border-border flex items-center justify-center text-muted-foreground/20">
                    <MessageSquare className="size-6" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Listening for Stream...</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-loose max-w-[250px] opacity-40">
                      IDENTIFICATION OF CLINICAL TRANSMISSION REQUIRED TO INITIALIZE TRANSCRIPTION LOGS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-1000">
                   <div className="flex items-center justify-between border-b border-border pb-6">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">Transmission Index</span>
                      <Sparkles className="size-4 text-primary opacity-50" />
                   </div>
                   <div className="relative">
                      <p className="text-xs font-bold leading-relaxed text-muted-foreground uppercase tracking-widest italic border-l border-primary/20 pl-8 py-2 py-8">
                        "{transcription}"
                      </p>
                      <div className="absolute top-0 left-0 w-px h-1/2 bg-primary" />
                   </div>
                   <div className="pt-8 flex flex-col gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Protocol Verified</span>
                       <div className="h-px w-full bg-border" />
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
