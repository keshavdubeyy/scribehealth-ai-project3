"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Loader2,
  FileDown,
  RefreshCw,
  Eye,
  AlertCircle,
} from "lucide-react"
import { Patient, Session, useScribeStore } from "@/lib/mock-store"
import { toast } from "sonner"

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "3 times daily",
  "4 times daily",
  "Every 8 hours",
  "Every 12 hours",
  "At bedtime",
  "As needed (SOS)",
]

const TIMINGS = [
  "After food",
  "Before food",
  "With food",
  "Empty stomach",
  "At bedtime",
  "Any time",
]

interface Medicine {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  timing: string
}

interface PrescriptionTabProps {
  session: Session
  patient: Patient
}

export function PrescriptionTab({ session, patient }: PrescriptionTabProps) {
  const { updateSession, prescriptionTemplate } = useScribeStore()

  const [patientName, setPatientName] = React.useState(patient.name)
  const [age, setAge] = React.useState(String(patient.age ?? ""))
  const [dateStr, setDateStr] = React.useState(
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  )
  const [reasonForVisit, setReasonForVisit] = React.useState(
    session.soap?.s?.split("\n")[0] ?? ""
  )
  const [whatsWrong, setWhatsWrong] = React.useState("")
  const [medicines, setMedicines] = React.useState<Medicine[]>(
    session.prescription?.medicines ?? []
  )
  const [nextSteps, setNextSteps] = React.useState<string[]>(
    session.prescription?.nextSteps
      ? session.prescription.nextSteps.split("\n").filter(Boolean)
      : []
  )
  const [isAutoFilling, setIsAutoFilling] = React.useState(false)
  const [isFillingMeds, setIsFillingMeds] = React.useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)

  // Auto-fill on mount
  React.useEffect(() => {
    if (!session.soap?.a) return
    setIsAutoFilling(true)
    setIsFillingMeds(true)
    const t = setTimeout(async () => {
      setWhatsWrong(
        session.soap?.a
          ? `${session.soap.a}. This is causing the symptoms you've been experiencing.`
          : ""
      )
      setMedicines([
        {
          id: "m1",
          name: "Tab Amoxicillin 500mg",
          dose: "1 tablet",
          frequency: "3 times daily",
          duration: "5 days",
          timing: "After food",
        },
        {
          id: "m2",
          name: "Tab Paracetamol 650mg",
          dose: "1 tablet",
          frequency: "As needed (SOS)",
          duration: "3 days",
          timing: "After food",
        },
      ])
      setNextSteps([
        "Drink fluids and rest for 48 hours",
        "Come back if fever persists beyond 3 days",
        "Avoid cold or iced drinks",
      ])
      setIsAutoFilling(false)
      setIsFillingMeds(false)
    }, 2200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addMedicine = () => {
    setMedicines(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: "",
        dose: "",
        frequency: "Once daily",
        duration: "",
        timing: "After food",
      },
    ])
  }

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const addStep = () => setNextSteps(prev => [...prev, ""])
  const removeStep = (i: number) =>
    setNextSteps(prev => prev.filter((_, idx) => idx !== i))
  const updateStep = (i: number, value: string) =>
    setNextSteps(prev => prev.map((s, idx) => (idx === i ? value : s)))

  const handleRefillMeds = async () => {
    setIsFillingMeds(true)
    await new Promise(r => setTimeout(r, 1800))
    setIsFillingMeds(false)
    toast.success("Medicines refreshed from note")
  }

  const handleDownloadPdf = async () => {
    if (!prescriptionTemplate) {
      toast.error("Upload your letterhead in Rx Template first")
      return
    }
    setIsGeneratingPdf(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast.success("Prescription downloaded")
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── LEFT COLUMN: Editor ── */}
      <div className="space-y-5">
        {/* Patient info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Patient name</Label>
            <Input
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Age</Label>
            <Input
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="yrs"
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Date</Label>
            <Input
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Reason for visit */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reason for visit
          </Label>
          <Input
            value={reasonForVisit}
            onChange={e => setReasonForVisit(e.target.value)}
            placeholder="e.g. Fever and cough for 3 days"
            className="h-8 text-sm"
          />
        </div>

        {/* What's wrong */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What&apos;s wrong
          </Label>
          <p className="text-xs text-muted-foreground">
            Plain language — written for the patient, not the doctor.
          </p>
          {isAutoFilling ? (
            <div className="flex items-center gap-2 h-16 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading from consultation…
            </div>
          ) : (
            <Textarea
              value={whatsWrong}
              onChange={e => setWhatsWrong(e.target.value)}
              rows={2}
              placeholder="e.g. You have a throat infection causing fever and cough."
              className="text-sm resize-none"
            />
          )}
        </div>

        <Separator />

        {/* Medicines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Medicines
            </Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-muted-foreground"
              onClick={handleRefillMeds}
              disabled={isFillingMeds}
            >
              {isFillingMeds
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Parsing…</>
                : <><RefreshCw className="w-3 h-3" /> Re-read from note</>
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Only add actual medicines here. Tests, scans, and advice go in &apos;What to do
            next&apos; below.
          </p>

          {isFillingMeds ? (
            <div className="flex items-center gap-2 h-12 text-sm text-muted-foreground w-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting medicines from consultation…
            </div>
          ) : (
            <div className="space-y-2">
              {medicines.map((med, i) => (
                <div
                  key={med.id}
                  className="rounded-lg border bg-muted/30 p-3 space-y-2"
                >
                  {/* Row 1 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4">
                      {i + 1}.
                    </span>
                    <Input
                      value={med.name}
                      onChange={e => updateMedicine(med.id, "name", e.target.value)}
                      placeholder="e.g. Tab Paracetamol 500mg"
                      className="h-7 text-sm font-medium flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => removeMedicine(med.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {/* Row 2 */}
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <Input
                      value={med.dose}
                      onChange={e => updateMedicine(med.id, "dose", e.target.value)}
                      placeholder="Dose (e.g. 1 tab)"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={med.duration}
                      onChange={e => updateMedicine(med.id, "duration", e.target.value)}
                      placeholder="For how long (e.g. 5 days)"
                      className="h-7 text-xs"
                    />
                    <Select
                      value={med.frequency}
                      onValueChange={v => updateMedicine(med.id, "frequency", v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map(f => (
                          <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={med.timing}
                      onValueChange={v => updateMedicine(med.id, "timing", v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMINGS.map(t => (
                          <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={addMedicine}
          >
            <Plus className="w-3.5 h-3.5" />
            Add medicine
          </Button>
        </div>

        <Separator />

        {/* What to do next */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What to do next
          </Label>
          <p className="text-xs text-muted-foreground">
            Tests to get done, lifestyle advice, follow-up — in simple language.
          </p>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm shrink-0">•</span>
                <Input
                  value={step}
                  onChange={e => updateStep(i, e.target.value)}
                  placeholder="e.g. Get a blood test done / Come back in 5 days"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  onClick={() => removeStep(i)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={addStep}
          >
            <Plus className="w-3.5 h-3.5" />
            Add step
          </Button>
        </div>

        {/* Download PDF */}
        <Button
          className="w-full gap-2"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf || isAutoFilling}
        >
          {isGeneratingPdf
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            : <><FileDown className="w-4 h-4" /> Download prescription PDF</>
          }
        </Button>
      </div>

      {/* ── RIGHT COLUMN: Live Preview ── */}
      <div className="space-y-2 sticky top-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          Live preview
        </p>

        {!prescriptionTemplate ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800">
                No prescription template.{" "}
                <a
                  href="/patients/dashboard/prescription-template"
                  className="underline hover:text-yellow-900"
                >
                  Upload your letterhead
                </a>{" "}
                to enable PDF generation.
              </p>
            </div>
          </div>
        ) : (
          <PreviewPanel
            template={prescriptionTemplate}
            patientName={patientName}
            age={age}
            dateStr={dateStr}
            reasonForVisit={reasonForVisit}
            whatsWrong={whatsWrong}
            medicines={medicines}
            nextSteps={nextSteps}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Everything is editable on the left. Changes appear here instantly.
        </p>
      </div>
    </div>
  )
}

// ── Separate preview component so image scale is measured correctly ──────────

interface PreviewPanelProps {
  template: { imageUrl: string; safeZone: { x: number; y: number; width: number; height: number }; fontSize: number; lineHeight: number }
  patientName: string
  age: string
  dateStr: string
  reasonForVisit: string
  whatsWrong: string
  medicines: Array<{ id: string; name: string; dose: string; frequency: string; duration: string; timing: string }>
  nextSteps: string[]
}

function PreviewPanel({
  template,
  patientName,
  age,
  dateStr,
  reasonForVisit,
  whatsWrong,
  medicines,
  nextSteps,
}: PreviewPanelProps) {
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [scale, setScale] = React.useState(1)

  // Recompute scale whenever the image renders or the window resizes
  const computeScale = React.useCallback(() => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    setScale(img.clientWidth / img.naturalWidth)
  }, [])

  React.useEffect(() => {
    window.addEventListener("resize", computeScale)
    return () => window.removeEventListener("resize", computeScale)
  }, [computeScale])

  const { safeZone, fontSize, lineHeight } = template
  const sz = {
    left:   safeZone.x      * scale,
    top:    safeZone.y      * scale,
    width:  safeZone.width  * scale,
    height: safeZone.height * scale,
  }
  const hasZone = safeZone.width > 2 && safeZone.height > 2

  return (
    <div className="relative rounded-lg border overflow-hidden bg-white shadow-sm">
      <img
        ref={imgRef}
        src={template.imageUrl}
        alt="Prescription letterhead"
        className="w-full block"
        onLoad={computeScale}
      />

      {/* Overlay — only when a zone is defined */}
      {hasZone && (
        <div
          className="absolute pointer-events-none overflow-hidden"
          style={{ left: sz.left, top: sz.top, width: sz.width, height: sz.height }}
        >
          {/* Dashed safe-zone border */}
          <div className="absolute inset-0 border border-dashed border-blue-300 pointer-events-none" />

          {/* Prescription text content */}
          <div
            className="p-1 text-slate-900 overflow-hidden"
            style={{
              fontSize:   `${fontSize * scale * 0.9}px`,
              lineHeight: `${lineHeight * scale * 0.9}px`,
            }}
          >
            <p className="font-semibold truncate">
              {patientName}  ·  Age: {age}  ·  {dateStr}
            </p>
            {reasonForVisit && (
              <p className="text-gray-600">Reason: {reasonForVisit}</p>
            )}
            {whatsWrong && (
              <>
                <p className="font-semibold mt-0.5">What&apos;s wrong:</p>
                <p className="pl-1 whitespace-pre-wrap">{whatsWrong}</p>
              </>
            )}
            {medicines.length > 0 && (
              <>
                <p className="font-semibold mt-0.5">Medicines:</p>
                {medicines.map((med, i) => (
                  <div key={med.id}>
                    <p className="font-medium pl-1">{i + 1}. {med.name}</p>
                    <p className="pl-2 text-gray-500" style={{ fontSize: "0.85em" }}>
                      {[med.dose, med.frequency, med.duration, med.timing && `(${med.timing})`]
                        .filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                ))}
              </>
            )}
            {nextSteps.length > 0 && (
              <>
                <p className="font-semibold mt-0.5">What to do next:</p>
                {nextSteps.filter(Boolean).map((step, i) => (
                  <p key={i} className="pl-1">• {step}</p>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback: show content below letterhead if no zone drawn */}
      {!hasZone && (
        <div className="p-3 border-t text-slate-800 space-y-1" style={{ fontSize: 11, lineHeight: "16px" }}>
          <p className="font-semibold">{patientName}  ·  Age: {age}  ·  {dateStr}</p>
          {reasonForVisit && <p className="text-gray-600">Reason: {reasonForVisit}</p>}
          {whatsWrong && <p>What&apos;s wrong: {whatsWrong}</p>}
          {medicines.map((m, i) => (
            <p key={m.id}>{i + 1}. {m.name} — {m.dose}, {m.frequency}, {m.duration}</p>
          ))}
          {nextSteps.filter(Boolean).map((s, i) => <p key={i}>• {s}</p>)}
        </div>
      )}
    </div>
  )
}
