"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Trash2, Share2, Loader2, MessageSquare, Mic, FileText } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { toast } from "sonner"
import { format } from "date-fns"

// Note fields shown in the General OPD / SOAP template
const GENERAL_OPD_FIELDS = [
  { key: "chief_complaint",            label: "Chief complaint" },
  { key: "history_of_present_illness", label: "History of present illness" },
  { key: "examination",                label: "Examination" },
  { key: "diagnosis",                  label: "Diagnosis" },
  { key: "prescription",               label: "Prescription" },
  { key: "follow_up",                  label: "Follow-up" },
]

const TEMPLATES = [
  "General OPD / SOAP",
  "Mental Health (SOAP)",
  "Physiotherapy",
  "Pediatric",
  "Cardiology",
  "Surgical Follow-up",
]

type NoteFields = Record<string, string>

export default function SessionPage() {
  const { patientId, sessionId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions, updateSession, deleteSession } = useScribeStore()

  const [mounted,        setMounted]        = React.useState(false)
  const [activeTab,      setActiveTab]      = React.useState("note")
  const [template,       setTemplate]       = React.useState("General OPD / SOAP")
  const [note,           setNote]           = React.useState<NoteFields>({})
  const [isSaving,       setIsSaving]       = React.useState(false)
  const [isDeleteOpen,   setIsDeleteOpen]   = React.useState(false)
  const [isDeleting,     setIsDeleting]     = React.useState(false)

  const patient  = React.useMemo(() => mounted ? getPatient(patientId as string)  : null, [patientId, getPatient,  mounted])
  const sessions = React.useMemo(() => mounted ? getSessions(patientId as string) : [],   [patientId, getSessions, mounted])
  const session  = React.useMemo(() => sessions.find(s => s.id === sessionId),             [sessions, sessionId])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Seed note with demo content when session loads
  React.useEffect(() => {
    if (!session) return
    setNote({
      chief_complaint:            session.soap?.s ? session.soap.s.split("\n")[0] : "",
      history_of_present_illness: session.soap?.s || "",
      examination:                session.soap?.o || "",
      diagnosis:                  session.soap?.a || "",
      prescription:               "",
      follow_up:                  session.soap?.p || "",
    })
  }, [session])

  // Auto-save debounce
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleNoteChange(key: string, value: string) {
    setNote(prev => ({ ...prev, [key]: value }))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      // persist to store if needed
    }, 800)
  }

  if (!mounted || !patient || !session) return null

  // Generate session name: PatientFirstName_DDMonYYYY_HHMMam/pm
  const createdAt   = new Date(session.createdAt)
  const sessionName = `${patient.name.replace(/\s+/g, "")}_${format(createdAt, "ddMMMyyyy_hhmma").replace(" ", "").toUpperCase()}`
  const sessionDate = format(createdAt, "d MMMM yyyy 'at' hh:mm aa")

  const statusBadge = session.status === "COMPLETED"
    ? { label: "Completed", className: "bg-primary text-white hover:bg-primary" }
    : session.status === "PROCESSING"
    ? { label: "Processing", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" }
    : { label: "In progress", className: "bg-muted text-muted-foreground" }

  async function handleSaveComplete() {
    setIsSaving(true)
    try {
      await updateSession(session!.id, { status: "COMPLETED" })
      toast.success("Session saved and marked as complete.")
      router.push(`/patients/${patientId}`)
    } catch {
      toast.error("Could not save the session. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteSession(session!.id)
      toast.success("Session deleted.")
      router.push(`/patients/${patientId}`)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl pb-20 animate-in fade-in duration-300">

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <p className="text-sm text-muted-foreground">
              This will permanently delete this session and its note. This cannot be undone.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin size-4" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: back + title */}
          <div className="space-y-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/patients/${patientId}`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -ml-2 h-auto px-2 py-1"
            >
              <ArrowLeft className="size-3.5" />
              <span className="truncate">{sessionName}</span>
            </Button>
            <p className="text-sm text-muted-foreground">
              {patient.name} · {sessionDate}
            </p>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => router.push(`/patients/${patientId}`)}
            >
              Change patient
            </Button>
            <Button size="sm" className="gap-1.5">
              <Share2 className="size-3.5" />
              View report
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          <Badge variant="secondary">{template}</Badge>
          {session.soap && <Badge variant="secondary">{Math.floor(Math.random() * 60 + 10)}s</Badge>}
          {patient.age && <Badge variant="secondary">{patient.age} yrs</Badge>}
          <Badge variant="secondary">Recording saved</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 bg-transparent border-b border-border w-full justify-start rounded-none p-0 gap-6">
          {[
            { value: "note",       label: "Clinical note", icon: FileText     },
            { value: "transcript", label: "Transcript",    icon: MessageSquare },
            { value: "audio",      label: "Audio",         icon: Mic           },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Clinical note tab */}
        <TabsContent value="note" className="mt-5 space-y-5">
          {/* Template selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Template detected:</span>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-52 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note fields */}
          <div className="space-y-4">
            {GENERAL_OPD_FIELDS.map(field => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {field.label}
                </Label>
                <Textarea
                  value={note[field.key] ?? ""}
                  onChange={e => handleNoteChange(field.key, e.target.value)}
                  className="min-h-[72px] resize-none text-sm leading-relaxed bg-card border-border focus-visible:ring-1 focus-visible:ring-primary/30"
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveComplete} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Save & complete
            </Button>
          </div>
        </TabsContent>

        {/* Transcript tab */}
        <TabsContent value="transcript" className="mt-5">
          <Empty className="border-2 py-24">
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No transcript</EmptyTitle>
              <EmptyDescription>No transcript is available for this session.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>

        {/* Audio tab */}
        <TabsContent value="audio" className="mt-5">
          <Empty className="border-2 py-24">
            <EmptyMedia variant="icon">
              <Mic />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No audio</EmptyTitle>
              <EmptyDescription>No audio recording was saved for this session.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>
      </Tabs>
    </div>
  )
}
