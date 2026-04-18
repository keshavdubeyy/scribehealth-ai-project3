"use client"

import * as React from "react"
import { useScribeStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function SessionsPage() {
  const router = useRouter()
  const { sessions, patients } = useScribeStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sessions])

  if (!mounted) return null

  return (
    <div className="p-6 max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/patients")}>
          <Plus className="w-4 h-4" />
          New session
        </Button>
      </div>

      {!sessions.length ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-lg font-semibold">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
              Start a recording with a patient to generate your first clinical note
            </p>
            <Button variant="outline" size="sm" className="mt-8 gap-2 px-6" onClick={() => router.push("/patients")}>
              <Plus className="w-4 h-4" />
              Start session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {sortedSessions.map((session) => {
              const patient = patients.find(p => p.id === session.patientId)
              const createdAt = new Date(session.createdAt)
              const sessionLabel = `${patient?.name.replace(/\s+/g, "") || "Unknown"}_${format(createdAt, "ddMMMyyyy_hhmma").replace(" ", "").toUpperCase()}`
              const chiefComplaint = session.soap?.s ? session.soap.s.split("\n")[0].trim() : null
              
              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/patients/${session.patientId}/sessions/${session.id}`)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-primary/[0.02] transition-all group cursor-pointer"
                >
                  <div className="min-w-0 pr-6">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold truncate font-mono tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {sessionLabel}
                      </p>
                      <span className="text-[10px] text-muted-foreground bg-muted h-5 px-2 flex items-center rounded-full font-bold tabular-nums">
                        {format(createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                    {chiefComplaint && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate leading-relaxed max-w-md">
                        {chiefComplaint}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-5 px-1.5 bg-muted/50 border-0">
                          GENERAL OPD
                        </Badge>
                        <Badge 
                          variant={session.status === "COMPLETED" ? "default" : "outline"}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest h-5 px-2",
                            session.status === "COMPLETED" ? "bg-emerald-500 text-white" : "text-amber-600 border-amber-500/30"
                          )}
                        >
                          {session.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" />
                        <span>55s</span>
                        <span>·</span>
                        <span className="hover:text-primary transition-colors">{patient?.name}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
