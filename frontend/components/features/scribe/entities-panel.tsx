"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, RefreshCw } from "lucide-react"
import type { MedicalEntities, Session } from "@/lib/mock-store"
import { useScribeStore } from "@/lib/mock-store"
import { toast } from "sonner"

interface EntitiesPanelProps {
  session: Session
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {count > 0 && (
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
      )}
    </div>
  )
}

function EmptyRow() {
  return <p className="text-xs text-muted-foreground/60 italic">None mentioned</p>
}

function EntitiesDisplay({ entities }: { entities: MedicalEntities }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

      {/* Symptoms */}
      <div>
        <SectionHeader title="Symptoms" count={entities.symptoms.length} />
        {entities.symptoms.length === 0 ? <EmptyRow /> : (
          <ul className="space-y-1">
            {entities.symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Diagnoses */}
      <div>
        <SectionHeader title="Diagnoses" count={entities.diagnoses.length} />
        {entities.diagnoses.length === 0 ? <EmptyRow /> : (
          <div className="flex flex-wrap gap-1.5">
            {entities.diagnoses.map((d, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">{d}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Medications */}
      <div className="sm:col-span-2">
        <SectionHeader title="Medications" count={entities.medications.length} />
        {entities.medications.length === 0 ? <EmptyRow /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entities.medications.map((m, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2 space-y-0.5">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div>
        <SectionHeader title="Allergies" count={entities.allergies.length} />
        {entities.allergies.length === 0 ? <EmptyRow /> : (
          <div className="space-y-1.5">
            {entities.allergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span>{a.substance}</span>
                <Badge
                  variant="secondary"
                  className={
                    a.severity === "severe"
                      ? "text-[10px] bg-red-100 text-red-700"
                      : a.severity === "moderate"
                      ? "text-[10px] bg-amber-100 text-amber-700"
                      : "text-[10px]"
                  }
                >
                  {a.severity}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitals */}
      <div>
        <SectionHeader title="Vitals" count={entities.vitals.length} />
        {entities.vitals.length === 0 ? <EmptyRow /> : (
          <div className="space-y-1.5">
            {entities.vitals.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{v.metric}</span>
                <span className="font-medium font-mono">{v.value} {v.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Treatment Plans */}
      <div className="sm:col-span-2">
        <SectionHeader title="Treatment Plans & Advice" count={entities.treatmentPlans.length} />
        {entities.treatmentPlans.length === 0 ? <EmptyRow /> : (
          <ul className="space-y-1">
            {entities.treatmentPlans.map((t, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}

export function EntitiesPanel({ session }: EntitiesPanelProps) {
  const { updateSession } = useScribeStore()
  const [isExtracting, setIsExtracting] = React.useState(false)

  const handleExtract = async () => {
    if (!session.transcription) return
    setIsExtracting(true)
    try {
      const res = await fetch("/api/extract-entities", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transcript: session.transcription }),
      })
      if (!res.ok) throw new Error("Extraction failed")
      const { entities } = await res.json()
      await updateSession(session.id, { entities })
      toast.success("Entities extracted from transcript")
    } catch {
      toast.error("Failed to extract entities")
    } finally {
      setIsExtracting(false)
    }
  }

  if (!session.transcription) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No transcript available — record a session first.
      </p>
    )
  }

  if (!session.entities) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Medical entities have not been extracted for this session.
        </p>
        <Button onClick={handleExtract} disabled={isExtracting} className="gap-2">
          {isExtracting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
            : <><Sparkles className="w-4 h-4" /> Extract entities</>
          }
        </Button>
      </div>
    )
  }

  const total = session.entities.symptoms.length
    + session.entities.diagnoses.length
    + session.entities.medications.length
    + session.entities.allergies.length
    + session.entities.vitals.length
    + session.entities.treatmentPlans.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total} entities extracted from transcript
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground"
          onClick={handleExtract}
          disabled={isExtracting}
        >
          {isExtracting
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Re-extracting…</>
            : <><RefreshCw className="w-3 h-3" /> Re-extract</>
          }
        </Button>
      </div>
      <EntitiesDisplay entities={session.entities} />
    </div>
  )
}
