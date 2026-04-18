"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Sparkles, Check, CheckCircle2, XCircle, Lock } from "lucide-react"
import { Session, useScribeStore } from "@/lib/mock-store"
import { logAudit } from "@/lib/audit"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ── Template definitions ─────────────────────────────────────────────────────

export const TEMPLATE_LABELS: Record<string, string> = {
  general_opd:        "General OPD",
  mental_health_soap: "Mental Health (SOAP)",
  physiotherapy:      "Physiotherapy",
  pediatric:          "Pediatric",
  cardiology:         "Cardiology",
  surgical_followup:  "Surgical Follow-up",
}

const TEMPLATE_FIELDS: Record<string, Array<{ key: string; label: string }>> = {
  general_opd: [
    { key: "subjective",   label: "Subjective" },
    { key: "objective",    label: "Objective" },
    { key: "assessment",   label: "Assessment" },
    { key: "diagnosis",    label: "Diagnosis" },
    { key: "prescription", label: "Prescription" },
    { key: "advice",       label: "Advice" },
    { key: "follow_up",    label: "Follow-up" },
  ],
  mental_health_soap: [
    { key: "subjective",        label: "Subjective" },
    { key: "objective",         label: "Objective" },
    { key: "assessment",        label: "Assessment" },
    { key: "plan",              label: "Plan" },
    { key: "safety_assessment", label: "Safety Assessment" },
  ],
  physiotherapy: [
    { key: "subjective",            label: "Subjective" },
    { key: "objective",             label: "Objective" },
    { key: "assessment",            label: "Assessment" },
    { key: "treatment",             label: "Treatment" },
    { key: "home_exercise_program", label: "Home Exercise Program" },
    { key: "plan",                  label: "Plan" },
  ],
  pediatric: [
    { key: "subjective",         label: "Subjective" },
    { key: "objective",          label: "Objective" },
    { key: "assessment",         label: "Assessment" },
    { key: "plan",               label: "Plan" },
    { key: "parent_instructions",label: "Parent Instructions" },
    { key: "follow_up",          label: "Follow-up" },
  ],
  cardiology: [
    { key: "subjective",  label: "Subjective" },
    { key: "objective",   label: "Objective" },
    { key: "assessment",  label: "Assessment" },
    { key: "plan",        label: "Plan" },
    { key: "medications", label: "Medications" },
    { key: "follow_up",   label: "Follow-up" },
  ],
  surgical_followup: [
    { key: "wound_assessment", label: "Wound Assessment" },
    { key: "subjective",       label: "Subjective" },
    { key: "objective",        label: "Objective" },
    { key: "assessment",       label: "Assessment" },
    { key: "plan",             label: "Plan" },
    { key: "next_review",      label: "Next Review" },
  ],
}

// ── NoteEditor ────────────────────────────────────────────────────────────────

interface NoteEditorProps {
  session: Session
  initialNote: Record<string, string>
  template: string
}

type SaveState = "idle" | "saving" | "saved"

function NoteEditor({ session, initialNote, template: initialTemplate }: NoteEditorProps) {
  const { updateSession } = useScribeStore()
  const router = useRouter()
  const [template, setTemplate]         = React.useState(initialTemplate)
  const [note, setNote]                 = React.useState<Record<string, string>>(initialNote)
  const [saveState, setSaveState]       = React.useState<SaveState>("idle")
  const [isRegenerating, setIsRegenerating] = React.useState(false)
  const [isApproving, setIsApproving]   = React.useState(false)
  const [isRejecting, setIsRejecting]   = React.useState(false)
  const saveTimer   = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer  = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const fields   = TEMPLATE_FIELDS[template] ?? TEMPLATE_FIELDS["general_opd"]
  const isLocked = session.status === "APPROVED"
  const isUnderReview = session.status === "UNDER_REVIEW" || session.status === "COMPLETED"
  const isRejected    = session.status === "REJECTED"

  const handleFieldChange = (key: string, value: string) => {
    if (isLocked) return
    const oldValue = note[key] ?? ""
    setNote(prev => ({ ...prev, [key]: value }))
    setSaveState("saving")

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const newEdits = [
          ...(session.edits ?? []),
          { field: key, oldValue, newValue: value, timestamp: new Date().toISOString() },
        ].slice(-20)
        await updateSession(session.id, { soap: { ...note, [key]: value }, edits: newEdits })
        await logAudit("note_edited", "session", session.id, { field: key, oldValue, newValue: value })
        setSaveState("saved")
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaveState("idle"), 2000)
      } catch {
        toast.error("Failed to save")
        setSaveState("idle")
      }
    }, 800)
  }

  const handleTemplateChange = async (newTemplate: string) => {
    if (isLocked) return
    setIsRegenerating(true)
    setTemplate(newTemplate)
    try {
      const res = await fetch("/api/generate-note", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transcript: session.transcription ?? "" }),
      })
      if (!res.ok) throw new Error("Regeneration failed")
      const { note: newNote } = await res.json() as { note: Record<string, string> }
      setNote(newNote)
      await updateSession(session.id, { soap: newNote, status: "UNDER_REVIEW" })
      toast.success(`Note regenerated for ${TEMPLATE_LABELS[newTemplate] ?? newTemplate}`)
    } catch {
      // Fallback: fill placeholders
      const generated: Record<string, string> = {}
      ;(TEMPLATE_FIELDS[newTemplate] ?? []).forEach(f => { generated[f.key] = "" })
      setNote(generated)
      toast.error("Regeneration failed — fields cleared for manual entry")
    } finally {
      setIsRegenerating(false)
    }
  }

  // FR-08: Approve — locks the note permanently
  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await updateSession(session.id, { soap: note, status: "APPROVED" })
      await logAudit("note_approved", "session", session.id)
      toast.success("Note approved and locked")
      router.refresh()
    } catch {
      toast.error("Failed to approve note")
    } finally {
      setIsApproving(false)
    }
  }

  // FR-08: Reject — flags for regeneration
  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await updateSession(session.id, { status: "REJECTED" })
      await logAudit("note_rejected", "session", session.id)
      toast.info("Note rejected — use 'Regenerate' to create a new one")
      router.refresh()
    } catch {
      toast.error("Failed to reject note")
    } finally {
      setIsRejecting(false)
    }
  }

  // FR-08: Regenerate after rejection
  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch("/api/generate-note", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transcript: session.transcription ?? "" }),
      })
      if (!res.ok) throw new Error("Regeneration failed")
      const { note: newNote } = await res.json() as { note: Record<string, string> }
      setNote(newNote)
      await updateSession(session.id, { soap: newNote, status: "UNDER_REVIEW" })
      await logAudit("note_regenerated", "session", session.id)
      toast.success("Note regenerated — review and approve when ready")
      router.refresh()
    } catch {
      toast.error("Regeneration failed")
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Approved banner ── */}
      {isLocked && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            This note has been approved and is locked for editing.
          </p>
        </div>
      )}

      {/* ── Rejected banner ── */}
      {isRejected && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 text-red-700 shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              This note was rejected and is flagged for regeneration.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-100 shrink-0"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating…</>
              : <><Sparkles className="w-3 h-3" /> Regenerate note</>
            }
          </Button>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Template:</span>
        <Badge variant="secondary">{TEMPLATE_LABELS[template] ?? template}</Badge>
        {!isLocked && (
          <Select value={template} onValueChange={handleTemplateChange} disabled={isRegenerating || isRejected}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isRegenerating && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Regenerating…
          </span>
        )}
      </div>

      <Separator />

      {/* Fields */}
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {field.label}
            </Label>
            <Textarea
              value={note[field.key] ?? ""}
              onChange={e => handleFieldChange(field.key, e.target.value)}
              placeholder={`${field.label}…`}
              className={cn("text-sm resize-none leading-relaxed", isLocked && "opacity-70 cursor-not-allowed")}
              rows={3}
              disabled={isRegenerating || isLocked || isRejected}
            />
          </div>
        ))}
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
        {/* Save indicator */}
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {saveState === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
          {saveState === "saved"  && <><Check className="w-3 h-3 text-green-600" /> Saved</>}
        </span>

        <div className="flex items-center gap-2">
          {/* Approve / Reject — only when note is under review */}
          {isUnderReview && !isLocked && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
              >
                {isRejecting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <XCircle className="w-3.5 h-3.5" />
                }
                Reject
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />
                }
                Approve note
              </Button>
            </>
          )}

          {/* Save & complete — shown when not yet under review and not locked */}
          {!isUnderReview && !isLocked && !isRejected && (
            <Button
              onClick={async () => {
                setSaveState("saving")
                try {
                  await updateSession(session.id, { soap: note, status: "UNDER_REVIEW" })
                  toast.success("Session note saved")
                  router.refresh()
                } catch {
                  toast.error("Failed to save")
                } finally { setSaveState("idle") }
              }}
              disabled={saveState === "saving"}
              size="sm"
            >
              Save &amp; complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── NoteSection ───────────────────────────────────────────────────────────────

interface NoteSectionProps {
  session: Session
}

export function NoteSection({ session }: NoteSectionProps) {
  const router = useRouter()
  const { updateSession } = useScribeStore()
  const [isGenerating, setIsGenerating] = React.useState(false)

  const initialNote: Record<string, string> = session.soap
    ? ("subjective" in session.soap
        ? session.soap
        : {
            subjective: session.soap.s ?? "",
            objective:  session.soap.o ?? "",
            assessment: session.soap.a ?? "",
            plan:       session.soap.p ?? "",
            diagnosis:  session.soap.a ?? "",
            follow_up:  session.soap.p ?? "",
          })
    : {}

  const template     = "general_opd"
  const hasNote      = Object.values(initialNote).some(v => v?.trim())
  const hasTranscript = !!session.transcription

  if (!hasNote && !hasTranscript) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No clinical note available for this session.
      </p>
    )
  }

  if (!hasNote && hasTranscript) {
    const handleGenerate = async () => {
      setIsGenerating(true)
      try {
        const res = await fetch("/api/generate-note", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ transcript: session.transcription }),
        })
        if (!res.ok) throw new Error("Generation failed")
        const { note } = await res.json() as { note: Record<string, string> }
        await updateSession(session.id, { soap: note, status: "UNDER_REVIEW" })
        await logAudit("note_generated", "session", session.id)
        toast.success("Clinical note generated")
        router.refresh()
      } catch {
        toast.error("Failed to generate note")
      } finally {
        setIsGenerating(false)
      }
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Clinical note was not generated for this session.
        </p>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          {isGenerating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Sparkles className="w-4 h-4" /> Generate clinical note</>
          }
        </Button>
      </div>
    )
  }

  return <NoteEditor session={session} initialNote={initialNote} template={template} />
}
