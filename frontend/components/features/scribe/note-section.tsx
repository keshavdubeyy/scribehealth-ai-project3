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
import { Loader2, Sparkles, Check } from "lucide-react"
import { Session, useScribeStore } from "@/lib/mock-store"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// ── Template definitions ────────────────────────────────────────────────────

export const TEMPLATE_LABELS: Record<string, string> = {
  general_opd:          "General OPD",
  mental_health_soap:   "Mental Health (SOAP)",
  physiotherapy:        "Physiotherapy",
  pediatric:            "Pediatric",
  cardiology:           "Cardiology",
  surgical_followup:    "Surgical Follow-up",
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
    { key: "subjective",             label: "Subjective" },
    { key: "objective",              label: "Objective" },
    { key: "assessment",             label: "Assessment" },
    { key: "treatment",              label: "Treatment" },
    { key: "home_exercise_program",  label: "Home Exercise Program" },
    { key: "plan",                   label: "Plan" },
  ],
  pediatric: [
    { key: "subjective",          label: "Subjective" },
    { key: "objective",           label: "Objective" },
    { key: "assessment",          label: "Assessment" },
    { key: "plan",                label: "Plan" },
    { key: "parent_instructions", label: "Parent Instructions" },
    { key: "follow_up",           label: "Follow-up" },
  ],
  cardiology: [
    { key: "subjective",   label: "Subjective" },
    { key: "objective",    label: "Objective" },
    { key: "assessment",   label: "Assessment" },
    { key: "plan",         label: "Plan" },
    { key: "medications",  label: "Medications" },
    { key: "follow_up",    label: "Follow-up" },
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
  const [template, setTemplate] = React.useState(initialTemplate)
  const [note, setNote] = React.useState<Record<string, string>>(initialNote)
  const [saveState, setSaveState] = React.useState<SaveState>("idle")
  const [isRegenerating, setIsRegenerating] = React.useState(false)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const fields = TEMPLATE_FIELDS[template] ?? TEMPLATE_FIELDS["general_opd"]

  const handleFieldChange = (key: string, value: string) => {
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
        await updateSession(session.id, {
          soap: {
            s: note.subjective ?? "",
            o: note.objective ?? "",
            a: note.assessment ?? "",
            p: note.plan ?? note.follow_up ?? "",
          },
          edits: newEdits,
        })
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
    setIsRegenerating(true)
    setTemplate(newTemplate)
    await new Promise(r => setTimeout(r, 1800))
    const newFields = TEMPLATE_FIELDS[newTemplate] ?? []
    const generated: Record<string, string> = {}
    newFields.forEach(f => { generated[f.key] = `AI-generated content for ${f.label}…` })
    setNote(generated)
    setIsRegenerating(false)
    toast.success("Note regenerated for new template")
  }

  const handleSaveAndComplete = async () => {
    setSaveState("saving")
    try {
      await updateSession(session.id, {
        soap: {
          s: note.subjective ?? "",
          o: note.objective ?? "",
          a: note.assessment ?? "",
          p: note.plan ?? note.follow_up ?? "",
        },
        status: "COMPLETED",
      })
      toast.success("Session note saved")
      router.refresh()
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaveState("idle")
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Template detected:</span>
        <Badge variant="secondary">{TEMPLATE_LABELS[template] ?? template}</Badge>
        <Select value={template} onValueChange={handleTemplateChange} disabled={isRegenerating}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isRegenerating && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Regenerating…
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
              className="text-sm resize-none leading-relaxed"
              rows={3}
              disabled={isRegenerating}
            />
          </div>
        ))}
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {saveState === "saving" && (
            <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
          )}
          {saveState === "saved" && (
            <><Check className="w-3 h-3 text-green-600" /> Saved</>
          )}
        </span>
        <Button
          onClick={handleSaveAndComplete}
          disabled={saveState === "saving"}
          size="sm"
        >
          Save &amp; complete
        </Button>
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

  // Build note from session data
  const initialNote: Record<string, string> = session.soap
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

  const template = "general_opd"
  const hasNote = Object.values(initialNote).some(v => v?.trim())
  const hasTranscript = !!session.transcription

  // Path B — no note, no transcript
  if (!hasNote && !hasTranscript) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No clinical note available for this session.
      </p>
    )
  }

  // Path A — no note but transcript exists → offer generate
  if (!hasNote && hasTranscript) {
    const handleGenerate = async () => {
      setIsGenerating(true)
      try {
        await new Promise(r => setTimeout(r, 2000))
        await updateSession(session.id, {
          soap: {
            s: "Patient presents with complaints extracted from transcript…",
            o: "On examination…",
            a: "Assessment based on findings…",
            p: "Plan: follow-up as needed…",
          },
        })
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

  // Path C — note exists
  return (
    <NoteEditor
      session={session}
      initialNote={initialNote}
      template={template}
    />
  )
}
