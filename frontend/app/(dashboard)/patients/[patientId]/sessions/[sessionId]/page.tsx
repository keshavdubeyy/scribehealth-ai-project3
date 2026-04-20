"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Trash2,
  FileText,
  Clock,
  Mic,
  User,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserMinus,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { NoteSection } from "@/components/features/scribe/note-section"
import { TranscriptPanel } from "@/components/features/scribe/transcript-panel"
import { PrescriptionTab } from "@/components/features/scribe/prescription-tab"
import { EntitiesPanel } from "@/components/features/scribe/entities-panel"

// ── Confidence helpers ──────────────────────────────────────────────────────

function confidenceColor(score: number) {
  if (score >= 80) return "text-green-700 bg-green-50 border-green-200"
  if (score >= 60) return "text-yellow-700 bg-yellow-50 border-yellow-200"
  return "text-red-700 bg-red-50 border-red-200"
}

function confidenceLabel(score: number) {
  if (score >= 80) return "High confidence"
  if (score >= 60) return "Medium confidence"
  return "Low confidence"
}

// ── Link Patient Dialog ─────────────────────────────────────────────────────

interface LinkPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  currentPatientId: string | null
  currentPatientName: string | null
}

function LinkPatientDialog({
  open,
  onOpenChange,
  sessionId,
  currentPatientId,
  currentPatientName,
}: LinkPatientDialogProps) {
  const { patients, updateSession } = useScribeStore()
  const router = useRouter()
  const [selected, setSelected] = React.useState<string>("")
  const [isSaving, setIsSaving] = React.useState(false)

  const isLinked = !!currentPatientId

  const handleLink = async () => {
    if (!selected) {
      toast.error("Select a patient")
      return
    }
    setIsSaving(true)
    try {
      const p = patients.find(p => p.id === selected)
      await updateSession(sessionId, { patientId: selected })
      toast.success(`Linked to ${p?.name ?? selected}`)
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Failed to link patient")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlink = async () => {
    setIsSaving(true)
    try {
      await updateSession(sessionId, { patientId: "" })
      toast.success("Patient unlinked")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Failed to unlink patient")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isLinked ? "Change patient" : "Link to patient"}</DialogTitle>
          {isLinked && currentPatientName && (
            <DialogDescription>
              Currently linked to <strong>{currentPatientName}</strong>. Select a
              different patient or unlink.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2 space-y-3">
          {patients.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No patients found. Add a patient first from the Patients page.
            </p>
          ) : (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.age ? ` · ${p.age} yrs` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isLinked && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive sm:mr-auto"
              onClick={handleUnlink}
              disabled={isSaving}
            >
              <UserMinus className="w-3.5 h-3.5" />
              Unlink
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={isSaving || !selected}>
            {isSaving ? "Saving…" : isLinked ? "Change" : "Link patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Session Dialog ────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onDeleted: () => void
}

function DeleteDialog({ open, onOpenChange, sessionId, onDeleted }: DeleteDialogProps) {
  const { deleteSession } = useScribeStore()
  const [deleteAudio, setDeleteAudio] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSession(sessionId)
      toast.success("Session deleted")
      onOpenChange(false)
      onDeleted()
    } catch {
      toast.error("Failed to delete session")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete session</DialogTitle>
          <DialogDescription>
            This will permanently delete the clinical note and transcript. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <Checkbox
            id="deleteAudio"
            checked={deleteAudio}
            onCheckedChange={(v) => setDeleteAudio(!!v)}
          />
          <Label htmlFor="deleteAudio" className="text-sm cursor-pointer font-normal">
            Also delete the audio recording
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Processing View ──────────────────────────────────────────────────────────

function SessionProcessingView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-medium">Processing session…</p>
        <p className="text-sm text-muted-foreground">
          Transcribing audio and generating clinical note
        </p>
      </div>
    </div>
  )
}

// ── Session Page ─────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { patientId, sessionId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions } = useScribeStore()

  const [mounted, setMounted] = React.useState(false)
  const [isLinkOpen, setIsLinkOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const patient = React.useMemo(
    () => (mounted ? getPatient(patientId as string) : null),
    [patientId, getPatient, mounted]
  )
  const sessions = React.useMemo(
    () => (mounted ? getSessions(patientId as string) : []),
    [patientId, getSessions, mounted]
  )
  const session = React.useMemo(
    () => sessions.find(s => s.id === sessionId),
    [sessions, sessionId]
  )

  if (!mounted || !patient || !session) return null

  const createdAt = new Date(session.createdAt)
  // Session name: PatientName_10Apr2026_0542PM
  const sessionName = `${patient.name.replace(/\s+/g, "")}_${format(createdAt, "ddMMMyyy_hhmma")}`
  const sessionDateText = new Date(session.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Mock AI confidence for demo
  const hash = session.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const confidence: number | null = session.status === "COMPLETED" ? 80 + (hash % 19) : null

  // Support both new (template keys) and old (s/o/a/p) soap shapes
  const finalNote: Record<string, string> = session.soap
    ? ("subjective" in session.soap
        ? session.soap
        : {
            subjective:   session.soap.s ?? "",
            objective:    session.soap.o ?? "",
            assessment:   session.soap.a ?? "",
            plan:         session.soap.p ?? "",
            diagnosis:    session.soap.a ?? "",
            follow_up:    session.soap.p ?? "",
          })
    : {}
  const hasNote = Object.values(finalNote).some(v => v?.trim())
  const hasEdits = (session.edits?.length ?? 0) > 0
  const chiefComplaint = (session.soap?.subjective ?? session.soap?.s ?? "").split("\n")[0]?.trim()

  // ── Header shared between both render paths ──
  const header = (
    <div className="flex items-center gap-3">
      <Link href={`/patients/${patientId}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold truncate font-mono tracking-tight">
          {sessionName}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span
            className="hover:text-primary transition-colors cursor-pointer"
            onClick={() => router.push(`/patients/${patientId}`)}
          >
            {patient.name}
          </span>
          {" · "}
          {sessionDateText}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Link patient button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsLinkOpen(true)}
        >
          {session.patientId
            ? <><UserCheck className="w-3.5 h-3.5" /> Change patient</>
            : <><UserPlus className="w-3.5 h-3.5" /> Link patient</>
          }
        </Button>

        {/* View report (only if note has content) */}
        {hasNote && (
          <Link href={`/sessions/${sessionId}/report`} target="_blank">
            <Button size="sm" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              View report
            </Button>
          </Link>
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // ── Dialogs ──
  const dialogs = (
    <>
      <LinkPatientDialog
        open={isLinkOpen}
        onOpenChange={setIsLinkOpen}
        sessionId={session.id}
        currentPatientId={session.patientId ?? null}
        currentPatientName={patient.name ?? null}
      />
      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        sessionId={session.id}
        onDeleted={() => router.push(`/patients/${patientId}`)}
      />
    </>
  )

  // ── Processing path ──
  const PIPELINE_STATUSES = ["PROCESSING", "RECORDED", "TRANSCRIBED", "IN_PROGRESS"] as const
  type PipelineStatus = typeof PIPELINE_STATUSES[number]
  if (PIPELINE_STATUSES.includes(session.status as PipelineStatus)) {
    return (
      <div className="p-6 max-w-3xl space-y-5">
        {dialogs}
        {header}
        <SessionProcessingView />
      </div>
    )
  }

  // ── Ready path ──
  return (
    <div className="p-6 max-w-5xl space-y-5 animate-in fade-in duration-300">
      {dialogs}

      {/* Header */}
      {header}

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status — all 7 lifecycle states */}
        {session.status === "APPROVED" ? (
          <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </Badge>
        ) : session.status === "REJECTED" ? (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        ) : session.status === "UNDER_REVIEW" || session.status === "COMPLETED" ? (
          <Badge variant="default" className="gap-1">Under review</Badge>
        ) : session.status === "TRANSCRIBED" ? (
          <Badge variant="secondary">Transcribed</Badge>
        ) : session.status === "RECORDED" ? (
          <Badge variant="secondary">Recorded</Badge>
        ) : session.status === "IN_PROGRESS" ? (
          <Badge variant="secondary">In progress</Badge>
        ) : (
          <Badge variant="outline" className="capitalize">{session.status.toLowerCase()}</Badge>
        )}

        {/* Template */}
        {session.soap && (
          <Badge variant="secondary">General OPD</Badge>
        )}

        {/* Duration — mocked */}
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          55s
        </Badge>

        {/* Patient age */}
        {patient.age && (
          <Badge variant="outline" className="gap-1">
            <User className="w-3 h-3" />
            {patient.age} yrs
          </Badge>
        )}

        {/* Recording saved */}
        {session.audioUrl && (
          <Badge variant="outline" className="gap-1">
            <Mic className="w-3 h-3" />
            Recording saved
          </Badge>
        )}

        {/* AI Confidence */}
        {confidence !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
              confidenceColor(confidence)
            )}
          >
            <ShieldCheck className="w-3 h-3" />
            {confidence}% · {confidenceLabel(confidence)}
          </span>
        )}
      </div>

      {/* Chief Complaint Card */}
      {chiefComplaint && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-1">
              Chief complaint
            </p>
            <p className="text-sm">{chiefComplaint}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="note">
        <TabsList>
          <TabsTrigger value="note">Clinical note</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          {session.audioUrl && <TabsTrigger value="audio">Audio</TabsTrigger>}
          {hasEdits && <TabsTrigger value="history">Edit history</TabsTrigger>}
        </TabsList>

        {/* Clinical Note */}
        <TabsContent value="note" className="mt-4">
          <NoteSection session={session} />
        </TabsContent>

        {/* Entities */}
        <TabsContent value="entities" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <EntitiesPanel session={session} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescription */}
        <TabsContent value="prescription" className="mt-4">
          <PrescriptionTab session={session} patient={patient} />
        </TabsContent>

        {/* Transcript — force mount to avoid layout shift */}
        <TabsContent
          value="transcript"
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          <Card>
            <CardContent className="pt-5">
              <TranscriptPanel session={session} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio */}
        {session.audioUrl && (
          <TabsContent value="audio" className="mt-4">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <p className="text-sm font-medium">Session recording</p>
                <audio controls src={session.audioUrl} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Recording is stored securely and linked to this session only.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Edit History */}
        {hasEdits && (
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="pt-5">
                <div className="space-y-3">
                  {(session.edits ?? []).map((edit, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{edit.field}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(edit.timestamp).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                      <Separator className="my-1.5" />
                      <p className="text-xs text-muted-foreground line-through">
                        {edit.oldValue || "(empty)"}
                      </p>
                      <p className="text-xs mt-1">{edit.newValue || "(empty)"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
