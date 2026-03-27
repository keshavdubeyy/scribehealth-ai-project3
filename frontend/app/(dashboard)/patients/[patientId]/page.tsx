"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Calendar, Clock, ChevronRight, User, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { RecordingModal } from "@/components/features/scribe/recording-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { toast } from "sonner"

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, fetchSessions, addSession, deleteSession } = useScribeStore()
  
  const [mounted, setMounted] = React.useState(false)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Confirmation Moodal State
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-destructive/10 rounded-2xl text-destructive font-bold uppercase tracking-widest text-[10px]">
          Protocol Identification Failed
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Patient Not Found</h2>
        <Button variant="outline" onClick={() => router.push("/patients")} className="rounded-xl font-bold uppercase tracking-tight">
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
    <div className="space-y-10 max-w-5xl mx-auto">
      <RecordingModal 
        isOpen={isRecordingModalOpen} 
        onClose={() => setIsRecordingModalOpen(false)}
        onRecordingComplete={onRecordingComplete}
      />

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        isLoading={isDeleting}
        title={confirmConfig.type === "patient" ? "Purge Patient Record" : "Purge Session Record"}
        description={confirmConfig.type === "patient" 
          ? "Are you sure you want to delete this patient and all associated clinical sessions? This action is permanent."
          : "Are you sure you want to delete this specific consultation record? This cannot be undone."
        }
        confirmText="Confirm Purge"
      />

      {/* Header / Breadcrumb */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => router.push("/patients")}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="size-3" />
          Directory Index
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                <User className="size-6" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                {patient?.name || "Loading..."}
              </h1>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md bg-white">
                    {patient?.gender || "--"}
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md bg-white">
                    {patient?.age || "--"} Y/O
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={openDeletePatientModal} variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-4 text-slate-400 hover:text-destructive hover:bg-destructive/5">
               <Trash2 className="size-3.5 mr-2" />
               Purge Record
            </Button>
            <Button onClick={handleStartSession} className="rounded-xl font-bold uppercase tracking-tight gap-2 shadow-sm h-10 px-6">
              <Plus className="size-4" />
              Start Session
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clinical History / Sessions</h2>
           <div className="flex-1 h-px bg-slate-100" />
        </div>

        {sessions.length === 0 ? (
          <div className="h-[300px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/40 gap-4">
            <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
               <Clock className="size-8" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No sessions yet</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start a new consultation to begin medical scribing.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sessions.map((session, index) => (
              <div 
                key={session.id} 
                onClick={() => router.push(`/patients/${patient.id}/sessions/${session.id}`)}
                className="group flex items-center justify-between p-6 rounded-2xl border border-slate-200 bg-white hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <Calendar className="size-5" />
                   </div>
                   <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">Session {sessions.length - index}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">
                        {format(new Date(session.createdAt), "MMMM dd, yyyy · HH:mm")}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                      {session.status}
                   </span>
                   <button 
                     onClick={(e) => openDeleteSessionModal(session.id, e)}
                     className="p-2 rounded-lg hover:bg-destructive/10 text-slate-300 hover:text-destructive transition-colors group/del"
                   >
                     <Trash2 className="size-4" />
                   </button>
                   <ChevronRight className="size-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
