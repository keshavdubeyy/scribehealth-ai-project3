"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, ChevronRight, Trash2, Loader2, Search } from "lucide-react"
import { format } from "date-fns"
import { RecordingModal } from "@/components/features/scribe/recording-modal"
import { PatientProfileCard } from "@/components/features/patients/patient-profile-card"
import { EditProfileDialog } from "@/components/features/patients/edit-profile-dialog"
import type { EditProfileData } from "@/components/features/patients/edit-profile-dialog"
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

import { PageHeader } from "@/components/page-header"

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, fetchSessions, deleteSession, updatePatientProfile } = useScribeStore()

  const [mounted,              setMounted]              = React.useState(false)
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false)
  const [isDeleting,           setIsDeleting]           = React.useState(false)
  const [searchQuery,          setSearchQuery]          = React.useState("")
  const [isConfirmOpen,        setIsConfirmOpen]        = React.useState(false)
  const [confirmConfig,        setConfirmConfig]        = React.useState<{ type: "session" | "patient"; id: string }>({ type: "session", id: "" })
  const [isEditProfileOpen,    setIsEditProfileOpen]    = React.useState(false)

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

  async function handleEditProfile(data: EditProfileData) {
    await updatePatientProfile(patientId as string, data)
    toast.success("Profile updated.")
  }

  function onSessionReady(sessionId: string) {
    setIsRecordingModalOpen(false)
    router.push(`/patients/${patient!.id}/sessions/${sessionId}`)
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        patientId={patientId as string}
        patientName={patient?.name ?? ""}
        onSessionReady={onSessionReady}
      />

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        initial={{
          chronicConditions: patient.chronicConditions,
          allergies:         patient.allergies,
          emergencyContact:  patient.emergencyContact,
          insuranceDetails:  patient.insuranceDetails,
        }}
        onSubmit={handleEditProfile}
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patients")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -ml-2 h-auto px-2 py-0"
          >
            <ArrowLeft className="size-3.5" />
            Back to Patients
          </Button>
          <PageHeader 
            title={patient.name} 
            description={`${patient.gender} · ${patient.age} years old`}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            className="h-10 px-5 text-muted-foreground font-semibold"
            onClick={() => setIsEditProfileOpen(true)}
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            className="h-10 px-5 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 font-semibold"
            onClick={() => { setConfirmConfig({ type: "patient", id: patientId as string }); setIsConfirmOpen(true) }}
          >
            Delete Patient
          </Button>
          <Button onClick={() => setIsRecordingModalOpen(true)} className="h-10 px-5 font-bold shadow-sm shadow-primary/20 gap-2">
            <Plus className="size-4" />
            New Session
          </Button>
        </div>
      </div>

      <PatientProfileCard
        chronicConditions={patient.chronicConditions}
        allergies={patient.allergies}
        emergencyContact={patient.emergencyContact}
        insuranceDetails={patient.insuranceDetails}
      />

      {/* Sessions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-9 h-9 text-sm w-full"
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
                <TableHead className="hidden sm:table-cell">ID</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
                <TableHead className="w-10" />
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
                            session.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                              : session.status === "REJECTED"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                              : session.status === "UNDER_REVIEW" || session.status === "COMPLETED"
                              ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/10"
                              : isProcessing
                              ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {session.status === "APPROVED"
                            ? "Approved"
                            : session.status === "REJECTED"
                            ? "Rejected"
                            : session.status === "UNDER_REVIEW" || session.status === "COMPLETED"
                            ? "Under review"
                            : session.status === "TRANSCRIBED"
                            ? "Transcribed"
                            : session.status === "RECORDED"
                            ? "Recorded"
                            : isProcessing
                            ? "Processing"
                            : "Scheduled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {session.id.toUpperCase().slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground hidden sm:table-cell">
                        {format(new Date(session.createdAt), "MMM dd, yy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {format(new Date(session.createdAt), "HH:mm")}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
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
