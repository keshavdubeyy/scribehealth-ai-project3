"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X, ChevronRight, ChevronLeft } from "lucide-react"
import type { ChronicCondition, Allergy, EmergencyContact, InsuranceDetails } from "@/lib/mock-store"

interface AddPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PatientFormData) => Promise<void>
}

export interface PatientFormData {
  name: string
  age: number
  gender: string
  email?: string
  phone?: string
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

const TOTAL_STEPS = 3

const STEP_LABELS = ["Basic Info", "Medical History", "Emergency & Insurance"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5">
            <div className={[
              "size-6 rounded-full text-xs font-semibold flex items-center justify-center",
              i + 1 === current
                ? "bg-primary text-primary-foreground"
                : i + 1 < current
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            ].join(" ")}>
              {i + 1 < current ? "✓" : i + 1}
            </div>
            <span className={[
              "text-xs hidden sm:block",
              i + 1 === current ? "text-foreground font-medium" : "text-muted-foreground"
            ].join(" ")}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={["h-px flex-1", i + 1 < current ? "bg-emerald-500" : "bg-border"].join(" ")} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function AddPatientDialog({ open, onOpenChange, onSubmit }: AddPatientDialogProps) {
  const [step,        setStep]        = React.useState(1)
  const [submitting,  setSubmitting]  = React.useState(false)
  const [fieldError,  setFieldError]  = React.useState<string | null>(null)

  const [name,   setName]   = React.useState("")
  const [age,    setAge]    = React.useState("")
  const [gender, setGender] = React.useState("")
  const [email,  setEmail]  = React.useState("")
  const [phone,  setPhone]  = React.useState("")

  const [conditions,     setConditions]     = React.useState<ChronicCondition[]>([])
  const [condInput,      setCondInput]      = React.useState("")
  const [condIcd,        setCondIcd]        = React.useState("")
  const [condYear,       setCondYear]       = React.useState("")

  const [allergies,      setAllergies]      = React.useState<Allergy[]>([])
  const [allergyInput,   setAllergyInput]   = React.useState("")
  const [allergySev,     setAllergySev]     = React.useState<Allergy["severity"]>("mild")
  const [allergyReaction,setAllergyReaction]= React.useState("")

  const [ecName,         setEcName]         = React.useState("")
  const [ecRel,          setEcRel]          = React.useState("")
  const [ecPhone,        setEcPhone]        = React.useState("")

  const [insProvider,    setInsProvider]    = React.useState("")
  const [insPolicy,      setInsPolicy]      = React.useState("")
  const [insUntil,       setInsUntil]       = React.useState("")

  function reset() {
    setStep(1); setFieldError(null)
    setName(""); setAge(""); setGender(""); setEmail(""); setPhone("")
    setConditions([]); setCondInput(""); setCondIcd(""); setCondYear("")
    setAllergies([]); setAllergyInput(""); setAllergySev("mild"); setAllergyReaction("")
    setEcName(""); setEcRel(""); setEcPhone("")
    setInsProvider(""); setInsPolicy(""); setInsUntil("")
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function validateStep1(): boolean {
    if (!name.trim())        { setFieldError("Full name is required.");   return false }
    if (!age || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150) {
      setFieldError("Please enter a valid age (0–150)."); return false
    }
    if (!gender.trim())      { setFieldError("Gender is required.");      return false }
    setFieldError(null)
    return true
  }

  function addCondition() {
    if (!condInput.trim()) return
    setConditions(prev => [...prev, {
      name:          condInput.trim(),
      icdCode:       condIcd.trim()  || undefined,
      diagnosedYear: condYear.trim() ? parseInt(condYear) : undefined,
    }])
    setCondInput(""); setCondIcd(""); setCondYear("")
  }

  function removeCondition(i: number) {
    setConditions(prev => prev.filter((_, idx) => idx !== i))
  }

  function addAllergy() {
    if (!allergyInput.trim()) return
    setAllergies(prev => [...prev, {
      substance: allergyInput.trim(),
      severity:  allergySev,
      reaction:  allergyReaction.trim() || undefined,
    }])
    setAllergyInput(""); setAllergySev("mild"); setAllergyReaction("")
  }

  function removeAllergy(i: number) {
    setAllergies(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (step < TOTAL_STEPS) {
      if (step === 1 && !validateStep1()) return
      setStep(s => s + 1)
      return
    }

    setSubmitting(true)
    setFieldError(null)
    try {
      const payload: PatientFormData = {
        name:   name.trim(),
        age:    Number(age),
        gender: gender.trim(),
        email:  email.trim()  || undefined,
        phone:  phone.trim()  || undefined,
        chronicConditions: conditions.length  ? conditions : undefined,
        allergies:         allergies.length   ? allergies  : undefined,
        emergencyContact:  ecName.trim() && ecPhone.trim()
          ? { name: ecName.trim(), relationship: ecRel.trim() || undefined, phone: ecPhone.trim() }
          : undefined,
        insuranceDetails:  insProvider.trim() && insPolicy.trim()
          ? { provider: insProvider.trim(), policyNumber: insPolicy.trim(), validUntil: insUntil.trim() || undefined }
          : undefined,
      }
      await onSubmit(payload)
      handleOpenChange(false)
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add patient</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} />

        {fieldError && (
          <p className="text-sm text-destructive -mt-2 mb-1">{fieldError}</p>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ap-name">Full name <span className="text-destructive">*</span></Label>
              <Input id="ap-name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ap-age">Age <span className="text-destructive">*</span></Label>
                <Input id="ap-age" type="number" placeholder="34" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ap-gender">Gender <span className="text-destructive">*</span></Label>
                <Input id="ap-gender" placeholder="Male" value={gender} onChange={e => setGender(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-email">
                Email <span className="text-muted-foreground font-normal text-xs">(optional — for sharing)</span>
              </Label>
              <Input id="ap-email" type="email" placeholder="patient@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-phone">
                Phone <span className="text-muted-foreground font-normal text-xs">(optional — WhatsApp / SMS)</span>
              </Label>
              <Input id="ap-phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Chronic Conditions</Label>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {c.name}{c.icdCode ? ` (${c.icdCode})` : ""}
                    <button type="button" onClick={() => removeCondition(i)} className="ml-0.5 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input className="col-span-3 sm:col-span-1" placeholder="Condition name" value={condInput} onChange={e => setCondInput(e.target.value)} />
                <Input placeholder="ICD code (e.g. E11)" value={condIcd} onChange={e => setCondIcd(e.target.value)} />
                <Input placeholder="Year diagnosed" type="number" value={condYear} onChange={e => setCondYear(e.target.value)} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCondition} className="gap-1.5">
                <Plus className="size-3.5" /> Add condition
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Allergies</Label>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className={[
                      "gap-1 text-xs",
                      a.severity === "severe"   ? "bg-destructive/10 text-destructive"   :
                      a.severity === "moderate" ? "bg-amber-500/10 text-amber-700"       :
                                                  "bg-muted text-muted-foreground"
                    ].join(" ")}
                  >
                    {a.substance} · {a.severity}
                    <button type="button" onClick={() => removeAllergy(i)} className="ml-0.5 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Substance (e.g. Penicillin)" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} />
                <Select value={allergySev} onValueChange={v => setAllergySev(v as Allergy["severity"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Reaction description (optional)" value={allergyReaction} onChange={e => setAllergyReaction(e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="gap-1.5">
                <Plus className="size-3.5" /> Add allergy
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Emergency Contact <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Contact name" value={ecName} onChange={e => setEcName(e.target.value)} />
                <Input placeholder="Relationship (e.g. Spouse)" value={ecRel} onChange={e => setEcRel(e.target.value)} />
              </div>
              <Input placeholder="Phone number" type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value)} />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Insurance Details <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Provider (e.g. Star Health)" value={insProvider} onChange={e => setInsProvider(e.target.value)} />
                <Input placeholder="Policy number" value={insPolicy} onChange={e => setInsPolicy(e.target.value)} />
              </div>
              <Input placeholder="Valid until (e.g. 2027-03-31)" value={insUntil} onChange={e => setInsUntil(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ChevronLeft className="size-4" /> Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 ml-auto"
          >
            {submitting
              ? <Loader2 className="animate-spin size-4" />
              : step < TOTAL_STEPS
              ? <><span>{step === 1 ? "Next" : "Next"}</span><ChevronRight className="size-4" /></>
              : "Add patient"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
