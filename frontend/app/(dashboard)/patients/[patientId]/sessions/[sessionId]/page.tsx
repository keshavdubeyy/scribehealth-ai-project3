"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, FileText, Activity, MessageSquare, Loader2, Sparkles, Wand2, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

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
  }, [searchParams, mounted, sessionId, session]) // Added session to dependencies for proper state refresh

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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-destructive/10 rounded-2xl text-destructive font-bold uppercase tracking-widest text-[10px]">
          Session Context Invalid
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Session Not Found</h2>
        <Button variant="outline" onClick={() => router.push(`/patients/${patientId}`)} className="rounded-xl font-bold uppercase tracking-tight">
          Return to Patient
        </Button>
      </div>
    )
  }

  const sessionIndex = sessions.length - sessions.findIndex(s => s.id === sessionId)

  return (
    <div className="relative min-h-screen">
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmPurge}
        isLoading={isDeleting}
        title="Purge Active Session"
        description="Are you sure you want to delete this consultation and all generated SOAP documentation? This action is permanent."
        confirmText="Confirm Purge"
      />

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
           <div className="relative">
              <div className="size-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Wand2 className="size-8 text-primary animate-pulse" />
              </div>
           </div>
           <div className="text-center space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                Converting <span className="text-primary italic font-black">Transmission</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Neutral processing algorithms at work</p>
           </div>
           
           <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-primary animate-progress" style={{ width: '60%' }} />
           </div>
        </div>
      )}

      <div className="space-y-8 max-w-6xl mx-auto pb-20">
        {/* Header / Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 bg-slate-50/50 -mx-8 px-8 pt-2 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => router.push(`/patients/${patient.id}`)}
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors w-fit mb-1"
            >
              <ArrowLeft className="size-3" />
              Patient Protocol
            </button>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {patient.name} <span className="text-slate-300 font-light">/</span> <span className="text-primary italic">Session {sessionIndex}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg mr-2 uppercase">
                {isProcessing ? "PROCESSING" : session.status}
              </span>
              <Button onClick={handleSave} variant="outline" className="rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 h-9 px-4 border-slate-200 shadow-sm bg-white hover:bg-slate-50">
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Save Note
              </Button>
              <Button onClick={() => setIsConfirmOpen(true)} variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 h-9 px-4 text-destructive hover:bg-destructive/5 hover:text-destructive">
                <Trash2 className="size-3" />
                Purge
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main SOAP Workspace */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <FileText className="size-4 text-primary" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Clinical Documentation (SOAP)</h2>
            </div>

            <div className="grid gap-6">
                {[
                  { label: "Subjective", key: "s", placeholder: "Patient's current symptoms and chief complaints..." },
                  { label: "Objective", key: "o", placeholder: "Vital signs, physical exams, and lab observations..." },
                  { label: "Assessment", key: "a", placeholder: "Clinical diagnoses and differential hypotheses..." },
                  { label: "Plan", key: "p", placeholder: "Pharmacological treatment, follow-up, and next actions..." }
                ].map((section) => (
                  <div key={section.key} className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400 group-focus-within:text-primary transition-colors">
                        {section.label}
                      </label>
                      {isProcessing && <Sparkles className="size-3 text-primary animate-pulse" />}
                    </div>
                    <Textarea 
                      value={soap[section.key as keyof typeof soap]}
                      onChange={(e) => setSoap({...soap, [section.key]: e.target.value})}
                      placeholder={section.placeholder}
                      className={cn(
                        "min-h-[120px] rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm leading-relaxed text-slate-700 p-4",
                        isProcessing && "animate-pulse"
                      )}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Sidebar Transcription Display */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Activity className="size-4 text-primary" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Real-time Scribing</h2>
            </div>

            <div className={cn(
              "h-full min-h-[500px] flex flex-col p-6 rounded-3xl border border-slate-200 shadow-sm transition-all duration-500",
              transcription ? "bg-white" : "bg-slate-100/30 border-dashed"
            )}>
              {!transcription ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-20 px-4">
                  <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
                    <MessageSquare className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Awaiting Audio Stream</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Transcription will appear here once clinical recording is initialized.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-700">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Captured Transcript</span>
                      <Sparkles className="size-3 text-primary" />
                   </div>
                   <p className="text-sm font-medium leading-loose text-slate-600 italic border-l-2 border-primary/20 pl-4 py-2">
                      "{transcription}"
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
