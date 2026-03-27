"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Plus, 
  ChevronRight, 
  User, 
  Trash2, 
  Loader2,
  Search
} from "lucide-react"
import { format } from "date-fns"
import { RecordingModal } from "@/components/features/scribe/recording-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, fetchSessions, addSession, deleteSession } = useScribeStore()
  
  const [mounted, setMounted] = React.useState(false)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

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

  const filteredSessions = React.useMemo(() => {
    return sessions.filter(s => 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sessions, searchQuery])

  if (!mounted || !patient) return null

  const handleConfirmAction = async () => {
    setIsDeleting(true)
    try {
      if (confirmConfig.type === "patient") {
        await (useScribeStore.getState() as any).deletePatient(confirmConfig.id)
        router.push("/patients")
        toast.success("Patient record purged.")
      } else {
        await deleteSession(confirmConfig.id)
        toast.success("Consultation record purged.")
      }
    } catch (err) {
      toast.error("Operation failure.")
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  async function onRecordingComplete(audioData: string) {
    if (!patient) return
    const id = await addSession(patient.id)
    setIsRecordingModalOpen(false)
    router.push(`/patients/${patient.id}/sessions/${id}?audio=${audioData}`)
  }

  return (
    <div className="flex flex-col gap-16 max-w-[1440px] animate-in fade-in duration-500">
      <RecordingModal isOpen={isRecordingModalOpen} onClose={() => setIsRecordingModalOpen(false)} onRecordingComplete={onRecordingComplete} />

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-md border-border p-8">
          <AlertDialogHeader className="space-y-2">
             <AlertDialogTitle className="text-xl font-semibold tracking-tight">System Confirmation</AlertDialogTitle>
             <p className="text-sm text-muted-foreground/60 font-medium">Are you certain you wish to purge this record? This operation is irreversible.</p>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="h-11 px-6 text-xs font-bold uppercase tracking-widest border-border hover:bg-muted/5 transition-all">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="h-11 px-6 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all">{isDeleting ? <Loader2 className="animate-spin" /> : "Confirm Purge"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 1. Dashboard Command Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
        <div className="space-y-4">
          <button onClick={() => router.push("/patients")} className="flex items-center gap-2 group text-xs font-bold text-muted-foreground/40 hover:text-foreground transition-all">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
            Registry Index
          </button>
          <div className="space-y-1.5">
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground leading-tight">{patient.name}</h1>
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground/60">
              <span className="flex items-center gap-1.5 font-semibold leading-none"><User className="size-3.5" /> {patient.gender}</span>
              <span className="size-1 rounded-full bg-muted-foreground/10" />
              <span className="leading-none">{patient.age} Y/O Identity</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { setConfirmConfig({ type: "patient", id: patientId as string }); setIsConfirmOpen(true) }} className="h-11 px-6 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 border-border font-bold text-xs uppercase tracking-widest transition-all">
             Purge Index
          </Button>
          <Button onClick={() => setIsRecordingModalOpen(true)} className="h-11 px-10 bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-sm transition-all">
            <Plus className="size-4 mr-2.5" />
            Initialize Consultation
          </Button>
        </div>
      </div>

      {/* 2. Clinical Index Section */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
            <p className="text-sm font-semibold tracking-tight text-muted-foreground/40 uppercase">Consolidated Clinical History</p>
            <div className="relative w-full lg:w-80 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-foreground transition-colors" />
                <Input placeholder="Filter by protocol identifier..." className="pl-10 h-11 border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/10 focus-visible:border-foreground/20 shadow-none text-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
        </div>

        <Table>
          <TableCaption className="mt-12 text-[11px] font-medium text-muted-foreground/20 uppercase tracking-[0.2em]">End of consultation history</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 overflow-hidden">
              <TableHead className="w-[300px]">Consultation</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Protocol ID</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Time</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-xs font-semibold text-muted-foreground/20 italic">
                  No historical entries detected.
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
                const sessionIndex = sessions.length - sessions.findIndex(s => s.id === session.id)
                const isProcessing = session.status === "PROCESSING" || !session.transcription
                return (
                  <TableRow key={session.id} className="group hover:bg-muted/5 cursor-pointer transition-colors" onClick={() => router.push(`/patients/${patient.id}/sessions/${session.id}`)}>
                    <TableCell className="font-medium h-16">
                      <div className="flex items-center gap-4">
                        <div className="size-8 bg-foreground flex items-center justify-center text-background font-mono text-[10px] rounded-md shadow-sm">C{sessionIndex}</div>
                        Consultation {sessionIndex}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn("text-[10px] font-bold px-3 py-1 border rounded-sm transition-all shadow-sm", session.status === "COMPLETED" ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" : isProcessing ? "bg-amber-500/5 text-amber-600 border-amber-500/10 animate-pulse" : "bg-destructive/5 text-destructive border-destructive/10")}>
                          {session.status === "COMPLETED" ? "Completed" : isProcessing ? "Processing" : "Failed"}
                       </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-[11px] text-muted-foreground/40">{session.id.toUpperCase().slice(0, 8)}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{format(new Date(session.createdAt), "MMM dd, yy")}</TableCell>
                    <TableCell className="text-center text-muted-foreground/40 text-sm font-medium">{format(new Date(session.createdAt), "HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3 transition-all">
                         <Button variant="ghost" size="icon" className="text-muted-foreground/40 hover:text-destructive h-9 w-9 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); setConfirmConfig({ type: "session", id: session.id }); setIsConfirmOpen(true) }}>
                           <Trash2 className="size-4" />
                         </Button>
                         <ChevronRight className="size-4 text-muted-foreground/20 group-hover:text-primary transition-all" />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
