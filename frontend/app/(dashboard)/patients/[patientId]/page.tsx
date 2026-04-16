"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, ChevronRight, User, Trash2, Loader2, Search } from "lucide-react"
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, fetchSessions, addSession, deleteSession } = useScribeStore()

  const [mounted,              setMounted]              = React.useState(false)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false)
  const [isDeleting,           setIsDeleting]           = React.useState(false)
  const [searchQuery,          setSearchQuery]          = React.useState("")
  const [isConfirmOpen,        setIsConfirmOpen]        = React.useState(false)
  const [confirmConfig,        setConfirmConfig]        = React.useState<{ type: "session" | "patient"; id: string }>({ type: "session", id: "" })

  React.useEffect(() => {
    setMounted(true)
    fetchSessions(patientId as string)
  }, [patientId, fetchSessions])

  const patient  = React.useMemo(() => mounted ? getPatient(patientId as string)        : null, [patientId, getPatient,  mounted])
  const sessions = React.useMemo(() => mounted ? getSessions(patientId as string)       : [],   [patientId, getSessions, mounted])

  const filtered = React.useMemo(() =>
    sessions.filter(s =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(searchQuery.toLowerCase())
    ), [sessions, searchQuery])

  if (!mounted || !patient) return null

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      if (confirmConfig.type === "patient") {
        await useScribeStore.getState().deletePatient(confirmConfig.id)
        router.push("/patients")
        toast.success("Patient deleted.")
      } else {
        await deleteSession(confirmConfig.id)
        toast.success("Session deleted.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  async function onRecordingComplete(audioData: string) {
    const id = await addSession(patient!.id)
    setIsRecordingModalOpen(false)
    router.push(`/patients/${patient!.id}/sessions/${id}?audio=${audioData}`)
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onRecordingComplete={onRecordingComplete}
      />

      {/* Delete confirmation */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmConfig.type === "patient" ? "Delete patient?" : "Delete session?"}
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground">
              {confirmConfig.type === "patient"
                ? "This will permanently delete the patient and all their sessions. This cannot be undone."
                : "This will permanently delete this session. This cannot be undone."}
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin size-4" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patients")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -ml-2 h-auto px-2 py-1"
          >
            <ArrowLeft className="size-3.5" />
            Back to patients
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">{patient.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="size-3.5" /> {patient.gender}</span>
              <span className="size-1 rounded-full bg-border" />
              <span>{patient.age} years old</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setConfirmConfig({ type: "patient", id: patientId as string }); setIsConfirmOpen(true) }}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
          >
            Delete patient
          </Button>
          <Button onClick={() => setIsRecordingModalOpen(true)} className="gap-2">
            <Plus className="size-4" />
            New session
          </Button>
        </div>
      </div>

      {/* Sessions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-[40%]">Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-sm text-muted-foreground">
                    {searchQuery ? "No sessions match your search." : "No sessions yet. Start a new session above."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(session => {
                  const idx         = sessions.length - sessions.findIndex(s => s.id === session.id)
                  const isProcessing = session.status === "PROCESSING" || !session.transcription
                  return (
                    <TableRow
                      key={session.id}
                      className="group cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/patients/${patient.id}/sessions/${session.id}`)}
                    >
                      <TableCell className="h-14">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 rounded-md shrink-0">
                            <AvatarFallback className="rounded-md bg-primary text-white text-xs font-semibold">
                              S{idx}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">Session {idx}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            session.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                              : isProcessing
                              ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                          )}
                        >
                          {session.status === "COMPLETED" ? "Completed" : isProcessing ? "Processing" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {session.id.toUpperCase().slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {format(new Date(session.createdAt), "MMM dd, yy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(session.createdAt), "HH:mm")}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            onClick={e => { e.stopPropagation(); setConfirmConfig({ type: "session", id: session.id }); setIsConfirmOpen(true) }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
    </div>
  )
}
