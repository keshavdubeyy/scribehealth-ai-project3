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
  Share2,
  Mail,
  MessageCircle,
  Phone,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Patient, Session, SafeZone, useScribeStore } from "@/lib/mock-store"
import { prescriptionSharingTemplate } from "@/lib/notifications"
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
  const { prescriptionTemplate } = useScribeStore()

  const [patientName, setPatientName] = React.useState(patient.name)
  const [age, setAge]                 = React.useState(String(patient.age ?? ""))
  const [dateStr, setDateStr]         = React.useState(
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
  )
  const [reasonForVisit, setReasonForVisit] = React.useState(
    (session.soap?.subjective ?? session.soap?.s ?? "").split("\n")[0]
  )
  const [whatsWrong, setWhatsWrong]   = React.useState("")
  const [medicines, setMedicines]     = React.useState<Medicine[]>(
    session.prescription?.medicines ?? []
  )
  const [nextSteps, setNextSteps]     = React.useState<string[]>(
    session.prescription?.nextSteps
      ? session.prescription.nextSteps.split("\n").filter(Boolean)
      : []
  )
  const [isAutoFilling, setIsAutoFilling]   = React.useState(false)
  const [isFillingMeds, setIsFillingMeds]   = React.useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
  const [isSharing, setIsSharing]           = React.useState(false)
  const autoFillRan = React.useRef(false)

  // Auto-fill on mount via Claude Haiku
  React.useEffect(() => {
    if (autoFillRan.current) return
    if (!session.soap && !session.transcription) return
    autoFillRan.current = true

    setIsAutoFilling(true)
    setIsFillingMeds(true)

    fetch("/api/prescriptions/parse", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ transcript: session.transcription, soap: session.soap }),
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Auto-fill failed")
        return res.json()
      })
      .then(data => {
        if (data.whatsWrong)         setWhatsWrong(data.whatsWrong)
        if (data.medicines?.length)  setMedicines(data.medicines)
        if (data.nextSteps?.length)  setNextSteps(data.nextSteps)
      })
      .catch(() => { /* silent — doctor fills manually */ })
      .finally(() => { setIsAutoFilling(false); setIsFillingMeds(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addMedicine = () =>
    setMedicines(prev => [...prev, { id: Math.random().toString(36).slice(2), name: "", dose: "", frequency: "Once daily", duration: "", timing: "After food" }])

  const removeMedicine = (id: string) => setMedicines(prev => prev.filter(m => m.id !== id))

  const updateMedicine = (id: string, field: keyof Medicine, value: string) =>
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const addStep    = () => setNextSteps(prev => [...prev, ""])
  const removeStep = (i: number) => setNextSteps(prev => prev.filter((_, idx) => idx !== i))
  const updateStep = (i: number, value: string) => setNextSteps(prev => prev.map((s, idx) => idx === i ? value : s))

  const handleRefillMeds = async () => {
    if (!session.soap && !session.transcription) return
    setIsFillingMeds(true)
    try {
      const res = await fetch("/api/prescriptions/parse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transcript: session.transcription, soap: session.soap }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Re-read failed")
      const data = await res.json()
      if (data.medicines?.length) { setMedicines(data.medicines); toast.success("Medicines updated from note") }
      else toast.info("No medicines found in the note")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-read failed")
    } finally {
      setIsFillingMeds(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!prescriptionTemplate) {
      toast.error("Upload your letterhead in Rx Template first")
      return
    }
    setIsGeneratingPdf(true)
    try {
      const res = await fetch("/api/prescriptions/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          templateId:     prescriptionTemplate.id,
          patientName,
          age,
          dateStr,
          reasonForVisit,
          whatsWrong,
          medicines,
          nextSteps,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "PDF generation failed")

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Prescription downloaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleSharePrescription = async (channel: "email" | "whatsapp" | "sms") => {
    const hasEmail = !!patient.email
    const hasPhone = !!patient.phone

    const { subject, body } = prescriptionSharingTemplate(patientName, {
      reasonForVisit, whatsWrong, medicines, nextSteps, dateStr,
    })

    // Generate and download the PDF first so the doctor has it to attach/send
    if (prescriptionTemplate) {
      setIsSharing(true)
      try {
        const res = await fetch("/api/prescriptions/generate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            templateId: prescriptionTemplate.id,
            patientName, age, dateStr, reasonForVisit, whatsWrong, medicines, nextSteps,
          }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url  = URL.createObjectURL(blob)
          const a    = document.createElement("a")
          a.href     = url
          a.download = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`
          a.click()
          URL.revokeObjectURL(url)
        }
      } catch {
        // Continue to open the channel even if PDF generation fails
      } finally {
        setIsSharing(false)
      }
    }

    if (channel === "email" && hasEmail) {
      window.open(`mailto:${encodeURIComponent(patient.email!)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
    } else if (channel === "whatsapp" && hasPhone) {
      window.open(`https://wa.me/${patient.phone!.replace(/\D/g, "")}?text=${encodeURIComponent(`*${subject}*\n\n${body}`)}`, "_blank")
    } else if (channel === "sms" && hasPhone) {
      window.open(`sms:${patient.phone}?body=${encodeURIComponent(`${subject}\n\n${body}`)}`, "_blank")
    }
  }

  const hasPatientContact = !!patient.email || !!patient.phone

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── LEFT COLUMN: Editor ── */}
      <div className="space-y-5">

        {/* Share Prescription dropdown */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prescription</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={isSharing || !hasPatientContact}
                title={!hasPatientContact ? "Add patient email or phone to enable sharing" : undefined}
              >
                {isSharing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing…</>
                  : <><Share2 className="w-3.5 h-3.5" /> Share prescription <ChevronDown className="w-3 h-3" /></>
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Send to {patientName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {patient.email && (
                <DropdownMenuItem onClick={() => handleSharePrescription("email")} className="gap-2 text-xs cursor-pointer">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  Email
                  <span className="text-muted-foreground truncate max-w-[140px]">{patient.email}</span>
                </DropdownMenuItem>
              )}
              {patient.phone && (
                <>
                  <DropdownMenuItem onClick={() => handleSharePrescription("whatsapp")} className="gap-2 text-xs cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    WhatsApp
                    <span className="text-muted-foreground">{patient.phone}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSharePrescription("sms")} className="gap-2 text-xs cursor-pointer">
                    <Phone className="w-3.5 h-3.5 text-violet-500" />
                    SMS
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Patient info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Patient name</Label>
            <Input value={patientName} onChange={e => setPatientName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Age</Label>
            <Input value={age} onChange={e => setAge(e.target.value)} placeholder="yrs" className="h-8 text-sm" />
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Date</Label>
            <Input value={dateStr} onChange={e => setDateStr(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>

        {/* Reason for visit */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason for visit</Label>
          <Input value={reasonForVisit} onChange={e => setReasonForVisit(e.target.value)} placeholder="e.g. Fever and cough for 3 days" className="h-8 text-sm" />
        </div>

        {/* What's wrong */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What&apos;s wrong</Label>
          <p className="text-xs text-muted-foreground">Plain language — written for the patient, not the doctor.</p>
          {isAutoFilling ? (
            <div className="flex items-center gap-2 h-16 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading from consultation…
            </div>
          ) : (
            <Textarea value={whatsWrong} onChange={e => setWhatsWrong(e.target.value)} rows={2} placeholder="e.g. You have a throat infection causing fever and cough." className="text-sm resize-none" />
          )}
        </div>

        <Separator />

        {/* Medicines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medicines</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground" onClick={handleRefillMeds} disabled={isFillingMeds}>
              {isFillingMeds
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Parsing…</>
                : <><RefreshCw className="w-3 h-3" /> Re-read from note</>
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Only actual medicines here. Tests, scans, and advice go in &apos;What to do next&apos; below.</p>

          {isFillingMeds ? (
            <div className="flex items-center gap-2 h-12 text-sm text-muted-foreground w-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting medicines from consultation…
            </div>
          ) : (
            <div className="space-y-2">
              {medicines.map((med, i) => (
                <div key={med.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                    <Input value={med.name} onChange={e => updateMedicine(med.id, "name", e.target.value)} placeholder="e.g. Tab Paracetamol 500mg" className="h-7 text-sm font-medium flex-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeMedicine(med.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <Input value={med.dose}     onChange={e => updateMedicine(med.id, "dose",     e.target.value)} placeholder="Dose (e.g. 1 tab)"          className="h-7 text-xs" />
                    <Input value={med.duration} onChange={e => updateMedicine(med.id, "duration", e.target.value)} placeholder="For how long (e.g. 5 days)" className="h-7 text-xs" />
                    <Select value={med.frequency} onValueChange={v => updateMedicine(med.id, "frequency", v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={med.timing} onValueChange={v => updateMedicine(med.id, "timing", v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMINGS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addMedicine}>
            <Plus className="w-3.5 h-3.5" /> Add medicine
          </Button>
        </div>

        <Separator />

        {/* Next steps */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to do next</Label>
          <p className="text-xs text-muted-foreground">Tests, lifestyle advice, follow-up — in simple language.</p>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm shrink-0">•</span>
                <Input value={step} onChange={e => updateStep(i, e.target.value)} placeholder="e.g. Get a blood test done / Come back in 5 days" className="h-8 text-sm flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => removeStep(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addStep}>
            <Plus className="w-3.5 h-3.5" /> Add step
          </Button>
        </div>

        {/* Download PDF */}
        <Button className="w-full gap-2" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isAutoFilling}>
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
                <a href="/patients/dashboard/prescription-template" className="underline hover:text-yellow-900">
                  Upload your letterhead
                </a>{" "}
                to enable PDF generation.
              </p>
            </div>
          </div>
        ) : (
          <PreviewPanel
            imageUrl={prescriptionTemplate.imageUrl}
            imageWidth={prescriptionTemplate.imageWidth}
            imageHeight={prescriptionTemplate.imageHeight}
            safeZone={prescriptionTemplate.safeZone}
            patientName={patientName}
            age={age}
            dateStr={dateStr}
            reasonForVisit={reasonForVisit}
            whatsWrong={whatsWrong}
            medicines={medicines}
            nextSteps={nextSteps}
          />
        )}

        <p className="text-xs text-muted-foreground">Everything is editable on the left. Changes appear here instantly.</p>
      </div>
    </div>
  )
}

// ── Live preview panel ────────────────────────────────────────────────────────

interface PreviewPanelProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  safeZone: SafeZone
  patientName: string
  age: string
  dateStr: string
  reasonForVisit: string
  whatsWrong: string
  medicines: Medicine[]
  nextSteps: string[]
}

function PreviewPanel({ imageUrl, imageWidth, imageHeight, safeZone, patientName, age, dateStr, reasonForVisit, whatsWrong, medicines, nextSteps }: PreviewPanelProps) {
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [renderWidth, setRenderWidth] = React.useState(0)

  const measure = React.useCallback(() => {
    if (imgRef.current) setRenderWidth(imgRef.current.clientWidth)
  }, [])

  React.useEffect(() => {
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  const scale = renderWidth > 0 ? renderWidth / imageWidth : 0
  const sz = {
    left:   safeZone.xPct      * imageWidth  * scale,
    top:    safeZone.yPct      * imageHeight * scale,
    width:  safeZone.widthPct  * imageWidth  * scale,
    height: safeZone.heightPct * imageHeight * scale,
  }
  const hasZone = safeZone.widthPct > 0.01 && safeZone.heightPct > 0.01 && scale > 0
  const fSize   = safeZone.fontSizePt   * scale * 1.33
  const lHeight = safeZone.lineHeightPt * scale * 1.33

  return (
    <div className="relative rounded-lg border overflow-hidden bg-white shadow-sm">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Prescription letterhead"
        className="w-full block"
        crossOrigin="anonymous"
        onLoad={measure}
      />

      {hasZone && (
        <div className="absolute pointer-events-none overflow-hidden" style={{ left: sz.left, top: sz.top, width: sz.width, height: sz.height }}>
          <div className="absolute inset-0 border border-dashed border-blue-300 pointer-events-none" />
          <div className="p-1 text-slate-900 overflow-hidden" style={{ fontSize: fSize, lineHeight: `${lHeight}px` }}>
            <p className="font-semibold truncate">{patientName}  ·  Age: {age}  ·  {dateStr}</p>
            {reasonForVisit && <p className="text-gray-600">Reason: {reasonForVisit}</p>}
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
                      {[med.dose, med.frequency, med.duration, med.timing && `(${med.timing})`].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                ))}
              </>
            )}
            {nextSteps.length > 0 && (
              <>
                <p className="font-semibold mt-0.5">What to do next:</p>
                {nextSteps.filter(Boolean).map((step, i) => <p key={i} className="pl-1">• {step}</p>)}
              </>
            )}
          </div>
        </div>
      )}

      {!hasZone && (
        <div className="p-3 border-t text-slate-800 space-y-1" style={{ fontSize: 11, lineHeight: "16px" }}>
          <p className="font-semibold">{patientName}  ·  Age: {age}  ·  {dateStr}</p>
          {reasonForVisit && <p className="text-gray-600">Reason: {reasonForVisit}</p>}
          {whatsWrong && <p>What&apos;s wrong: {whatsWrong}</p>}
          {medicines.map((m, i) => <p key={m.id}>{i + 1}. {m.name} — {m.dose}, {m.frequency}, {m.duration}</p>)}
          {nextSteps.filter(Boolean).map((s, i) => <p key={i}>• {s}</p>)}
        </div>
      )}
    </div>
  )
}
