"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Heart, AlertTriangle, Phone, Shield } from "lucide-react"
import type { ChronicCondition, Allergy, EmergencyContact, InsuranceDetails } from "@/lib/mock-store"

interface PatientProfileCardProps {
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

function SectionEmpty() {
  return <p className="text-xs text-muted-foreground italic">None recorded</p>
}

function AllergyBadge({ allergy }: { allergy: Allergy }) {
  const colours =
    allergy.severity === "severe"   ? "bg-destructive/10 text-destructive border-destructive/20" :
    allergy.severity === "moderate" ? "bg-amber-500/10 text-amber-700 border-amber-200"          :
                                      "bg-muted text-muted-foreground"

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${colours}`}>
      {allergy.substance}
      <span className="opacity-60">· {allergy.severity}</span>
    </span>
  )
}

export function PatientProfileCard({
  chronicConditions,
  allergies,
  emergencyContact,
  insuranceDetails,
}: PatientProfileCardProps) {
  const hasAny = (chronicConditions?.length ?? 0) > 0
    || (allergies?.length ?? 0) > 0
    || emergencyContact
    || insuranceDetails

  if (!hasAny) return null

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">Medical Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {((chronicConditions?.length ?? 0) > 0 || (allergies?.length ?? 0) > 0) && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Heart className="size-3.5" />
                Chronic Conditions
              </div>
              {chronicConditions && chronicConditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {chronicConditions.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {c.name}
                      {c.icdCode && <span className="ml-1 opacity-60">{c.icdCode}</span>}
                      {c.diagnosedYear && <span className="ml-1 opacity-60">({c.diagnosedYear})</span>}
                    </Badge>
                  ))}
                </div>
              ) : (
                <SectionEmpty />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <AlertTriangle className="size-3.5" />
                Allergies
              </div>
              {allergies && allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a, i) => <AllergyBadge key={i} allergy={a} />)}
                </div>
              ) : (
                <SectionEmpty />
              )}
            </div>
          </div>
        )}

        {(emergencyContact || insuranceDetails) && (
          <>
            {(chronicConditions?.length ?? 0) > 0 || (allergies?.length ?? 0) > 0
              ? <Separator />
              : null
            }
            <div className="grid sm:grid-cols-2 gap-5">
              {emergencyContact && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Phone className="size-3.5" />
                    Emergency Contact
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium text-foreground">{emergencyContact.name}</p>
                    {emergencyContact.relationship && (
                      <p className="text-muted-foreground text-xs">{emergencyContact.relationship}</p>
                    )}
                    <p className="text-muted-foreground text-xs">{emergencyContact.phone}</p>
                  </div>
                </div>
              )}

              {insuranceDetails && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Shield className="size-3.5" />
                    Insurance
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium text-foreground">{insuranceDetails.provider}</p>
                    <p className="text-muted-foreground text-xs">Policy: {insuranceDetails.policyNumber}</p>
                    {insuranceDetails.validUntil && (
                      <p className="text-muted-foreground text-xs">Valid until: {insuranceDetails.validUntil}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
