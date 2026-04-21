"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Plus, X } from "lucide-react"
import type { ChronicCondition, Allergy, EmergencyContact, InsuranceDetails } from "@/lib/mock-store"

export interface EditProfileData {
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EditProfileData
  onSubmit: (data: EditProfileData) => Promise<void>
}

export function EditProfileDialog({ open, onOpenChange, initial, onSubmit }: EditProfileDialogProps) {
  const [submitting,       setSubmitting]       = React.useState(false)
  const [fieldError,       setFieldError]       = React.useState<string | null>(null)

  const [conditions,       setConditions]       = React.useState<ChronicCondition[]>(initial.chronicConditions ?? [])
  const [condInput,        setCondInput]        = React.useState("")
  const [condIcd,          setCondIcd]          = React.useState("")
  const [condYear,         setCondYear]         = React.useState("")

  const [allergies,        setAllergies]        = React.useState<Allergy[]>(initial.allergies ?? [])
  const [allergyInput,     setAllergyInput]     = React.useState("")
  const [allergySev,       setAllergySev]       = React.useState<Allergy["severity"]>("mild")
  const [allergyReaction,  setAllergyReaction]  = React.useState("")

  const [ecName,           setEcName]           = React.useState(initial.emergencyContact?.name ?? "")
  const [ecRel,            setEcRel]            = React.useState(initial.emergencyContact?.relationship ?? "")
  const [ecPhone,          setEcPhone]          = React.useState(initial.emergencyContact?.phone ?? "")

  const [insProvider,      setInsProvider]      = React.useState(initial.insuranceDetails?.provider ?? "")
  const [insPolicy,        setInsPolicy]        = React.useState(initial.insuranceDetails?.policyNumber ?? "")
  const [insUntil,         setInsUntil]         = React.useState(initial.insuranceDetails?.validUntil ?? "")

  React.useEffect(() => {
    if (open) {
      setConditions(initial.chronicConditions ?? [])
      setAllergies(initial.allergies ?? [])
      setEcName(initial.emergencyContact?.name ?? "")
      setEcRel(initial.emergencyContact?.relationship ?? "")
      setEcPhone(initial.emergencyContact?.phone ?? "")
      setInsProvider(initial.insuranceDetails?.provider ?? "")
      setInsPolicy(initial.insuranceDetails?.policyNumber ?? "")
      setInsUntil(initial.insuranceDetails?.validUntil ?? "")
    }
  }, [open, initial])

  function addCondition() {
    if (!condInput.trim()) return
    setConditions(prev => [...prev, {
      name: condInput.trim(),
      icdCode: condIcd.trim() || undefined,
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
      severity: allergySev,
      reaction: allergyReaction.trim() || undefined,
    }])
    setAllergyInput(""); setAllergySev("mild"); setAllergyReaction("")
  }

  function removeAllergy(i: number) {
    setAllergies(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setFieldError(null)
    try {
      await onSubmit({
        chronicConditions: conditions.length ? conditions : undefined,
        allergies: allergies.length ? allergies : undefined,
        emergencyContact: ecName.trim() && ecPhone.trim()
          ? { name: ecName.trim(), relationship: ecRel.trim() || undefined, phone: ecPhone.trim() }
          : undefined,
        insuranceDetails: insProvider.trim() && insPolicy.trim()
          ? { provider: insProvider.trim(), policyNumber: insPolicy.trim(), validUntil: insUntil.trim() || undefined }
          : undefined,
      })
      onOpenChange(false)
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit medical profile</DialogTitle>
        </DialogHeader>

        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}

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
              <Input placeholder="ICD code" value={condIcd} onChange={e => setCondIcd(e.target.value)} />
              <Input placeholder="Year" type="number" value={condYear} onChange={e => setCondYear(e.target.value)} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCondition} className="gap-1.5">
              <Plus className="size-3.5" /> Add condition
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Allergies</Label>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a, i) => (
                <Badge key={i} variant="secondary" className={[
                  "gap-1 text-xs",
                  a.severity === "severe"   ? "bg-destructive/10 text-destructive"   :
                  a.severity === "moderate" ? "bg-amber-500/10 text-amber-700"       :
                                              "bg-muted text-muted-foreground"
                ].join(" ")}>
                  {a.substance} · {a.severity}
                  <button type="button" onClick={() => removeAllergy(i)} className="ml-0.5 hover:text-destructive">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Substance" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} />
              <Select value={allergySev} onValueChange={v => setAllergySev(v as Allergy["severity"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Reaction (optional)" value={allergyReaction} onChange={e => setAllergyReaction(e.target.value)} />
            <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="gap-1.5">
              <Plus className="size-3.5" /> Add allergy
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Emergency Contact</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={ecName} onChange={e => setEcName(e.target.value)} />
              <Input placeholder="Relationship" value={ecRel} onChange={e => setEcRel(e.target.value)} />
            </div>
            <Input placeholder="Phone" type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Insurance</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Provider" value={insProvider} onChange={e => setInsProvider(e.target.value)} />
              <Input placeholder="Policy number" value={insPolicy} onChange={e => setInsPolicy(e.target.value)} />
            </div>
            <Input placeholder="Valid until" value={insUntil} onChange={e => setInsUntil(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="animate-spin size-4" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
