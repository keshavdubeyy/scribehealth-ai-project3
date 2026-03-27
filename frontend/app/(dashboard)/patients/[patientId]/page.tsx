"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Calendar, Clock, ChevronRight, User, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { RecordingModal } from "@/components/features/scribe/recording-modal"
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
import { toast } from "sonner"

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, fetchSessions, addSession, deleteSession } = useScribeStore()
  
  const [mounted, setMounted] = React.useState(false)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [confirmConfig, setConfirmConfig] = React.useState({
    type: "session" as "session" | "patient",
    id: ""
  })

  React.useEffect(() => {
    setMounted(true)
    fetchSessions(patientId as string)
  }, [patientId, fetchSessions])

  const patient = React.useMemo(() => mounted ? getPatient(patientId as string) : null, [patientId, getPatient, mounted])
  const sessions = React.useMemo(() => mounted ? getSessions(patientId as string) : [], [patientId, getSessions, mounted])

  if (!mounted) return null

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
        <div className="flex flex-col items-center text-center gap-4 animate-in fade-in duration-700">
           <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive font-black uppercase tracking-[0.3em] text-[10px]">
             Protocol Identification Failed
           </div>
           <h2 className="text-2xl font-black uppercase tracking-tighter">Entity Not Detected</h2>
           <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest max-w-[200px]">The requested clinical record does not exist in the active index.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/patients")} className="font-black uppercase tracking-widest text-[10px] h-11 px-8">
          Return to Directory
        </Button>
      </div>
    )
  }

  async function handleStartSession() {
    setIsRecordingModalOpen(true)
  }

  const openDeletePatientModal = () => {
    setConfirmConfig({ type: "patient", id: patientId as string })
    setIsConfirmOpen(true)
  }

  const openDeleteSessionModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmConfig({ type: "session", id })
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = async () => {
    setIsDeleting(true)
    try {
      if (confirmConfig.type === "patient") {
        await (useScribeStore.getState() as any).deletePatient(confirmConfig.id)
        toast.success("Patient record purged from clinical system.")
        router.push("/patients")
      } else {
        await deleteSession(confirmConfig.id)
        toast.success("Session purged from historical index.")
      }
    } catch (err) {
      toast.error("Operation failed. Try again.")
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  async function onRecordingComplete(audioData: string) {
    if (!patient) return
    try {
      const sessionId = await addSession(patient.id)
      setIsRecordingModalOpen(false)
      toast.success("Consultation record provisioned in local index.")
      router.push(`/patients/${patient.id}/sessions/${sessionId}?audio=${audioData}`)
    } catch (err) {
      toast.error("Local session initialization failed.")
    }
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <RecordingModal 
        isOpen={isRecordingModalOpen} 
        onClose={() => setIsRecordingModalOpen(false)}
        onRecordingComplete={onRecordingComplete}
      />

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase tracking-widest text-lg font-black">
              {confirmConfig.type === "patient" ? "Purge Patient Record" : "Purge Session Record"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase tracking-[0.15em] font-medium leading-relaxed">
              {confirmConfig.type === "patient" 
                ? "Are you sure you want to delete this patient and all associated clinical sessions? This action is permanent."
                : "Are you sure you want to delete this specific consultation record? This cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase tracking-widest text-[10px]">Cancel Protocol</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleConfirmAction()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive font-black uppercase tracking-widest text-[10px]"
            >
               {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header / Navigation */}
      <div className="flex flex-col gap-10">
        <button 
          onClick={() => router.push("/patients")}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all w-fit group"
        >
          <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
          Directory Index
        </button>

        <div className="flex items-end justify-between border-b border-border pb-10">
          <div className="flex items-center gap-6">
            <div className="size-16 bg-muted/20 border border-border flex items-center justify-center text-foreground ring-8 ring-muted/5">
                <User className="size-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                {patient?.name || "Loading..."}
              </h1>
              <div className="flex items-center gap-4">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border px-3 py-1 bg-muted/10">
                    {patient?.gender || "--"}
                 </span>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border px-3 py-1 bg-muted/10">
                    {patient?.age || "--"} Y/O Profile
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={openDeletePatientModal} variant="ghost" className="font-black uppercase tracking-widest text-[10px] h-12 px-6 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
               <Trash2 className="size-4 mr-3" />
               Purge Record
            </Button>
            <Button onClick={handleStartSession} className="font-black uppercase tracking-[0.2em] text-[11px] h-12 px-10 shadow-none border-0">
              <Plus className="size-4 mr-3" />
              Start Consultation
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="space-y-8 animate-in fade-in duration-1000">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Historical Clinical Index</h2>
           <span className="text-[9px] font-bold text-primary italic uppercase tracking-widest">{sessions.length} Records Detected</span>
        </div>

        {sessions.length === 0 ? (
          <div className="h-[300px] border border-dashed border-border flex flex-col items-center justify-center bg-muted/5 gap-8">
            <div className="relative">
               <Clock className="size-12 text-muted-foreground/10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-foreground uppercase tracking-[0.3em] leading-none">Index Empty</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none opacity-50">Initiate a session to begin clinical tracking.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-px bg-border border border-border overflow-hidden">
            {sessions.map((session, index) => (
              <div 
                key={session.id} 
                onClick={() => router.push(`/patients/${patient.id}/sessions/${session.id}`)}
                className="group flex items-center justify-between p-8 bg-background hover:bg-muted/50 transition-all cursor-pointer relative"
              >
                <div className="flex items-center gap-6">
                   <div className="size-12 bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Calendar className="size-5" />
                   </div>
                   <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Consultation {sessions.length - index}</h3>
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors">ID: {session.id.slice(-6)}</span>
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none opacity-60">
                        {format(new Date(session.createdAt), "MMMM dd, yyyy · HH:mm")}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/5 px-3 py-1.5 border border-emerald-500/20">
                      {session.status}
                   </span>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={(e) => openDeleteSessionModal(session.id, e)}
                       className="p-3 bg-muted/0 hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-all group/del"
                     >
                       <Trash2 className="size-4" />
                     </button>
                     <ChevronRight className="size-5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                   </div>
                </div>
                <div className="absolute left-0 top-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
