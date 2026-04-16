"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useScribeStore } from "@/lib/mock-store"
import { Plus, FileText, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, generateSessionName } from "@/lib/design-system/formatters"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { patients, sessions } = useScribeStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const firstName = session?.user?.name?.split(" ")[0] ?? "Doctor"
  const today = formatDate(new Date())

  // Sessions in the last 7 days
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentCount = sessions.filter(s => new Date(s.createdAt).getTime() > oneWeekAgo).length

  // 5 most recent sessions, enriched with patient name, chief complaint, and confidence
  const recentSessions = React.useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => {
        const patient = patients.find(p => p.id === s.patientId)
        const sessionName = generateSessionName(patient?.name ?? "Unknown", new Date(s.createdAt))
        const chiefComplaint = s.soap?.s ? s.soap.s.split("\n")[0].trim() : null
        // Deterministic mock confidence: hash session ID into 80–99 range
        const hash = s.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        const confidence = s.status === "COMPLETED" ? 80 + (hash % 20) : null
        return { ...s, sessionName, patientName: patient?.name ?? "Unknown", chiefComplaint, confidence }
      })
  }, [sessions, patients])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hello, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => router.push("/patients")}
        >
          <Plus className="size-4" />
          New Session
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-border shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total sessions</p>
              <p className="text-3xl font-bold text-foreground mt-1">{sessions.length}</p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Patients</p>
              <p className="text-3xl font-bold text-foreground mt-1">{patients.length}</p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions this week */}
      {recentCount > 0 && (
        <p className="text-sm text-muted-foreground -mt-4">
          <span className="font-semibold text-foreground">{recentCount}</span> session{recentCount !== 1 ? "s" : ""} this week
        </p>
      )}

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent sessions</h2>
          <Link href="/patients" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            View all <ChevronRight className="size-3" />
          </Link>
        </div>

        <Card className="border border-border shadow-none">
          {recentSessions.length === 0 ? (
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No sessions yet. Start by adding a patient.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 cursor-pointer transition-colors gap-4"
                  onClick={() => router.push(`/patients/${s.patientId}/sessions/${s.id}`)}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{s.sessionName}</span>
                    {s.chiefComplaint && (
                      <span className="text-xs text-muted-foreground truncate">{s.chiefComplaint}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0 hover:bg-primary/10">
                      General OPD
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        s.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-700 border-0 hover:bg-emerald-500/10"
                          : s.status === "PROCESSING"
                          ? "bg-amber-500/10 text-amber-700 border-0 hover:bg-amber-500/10"
                          : "bg-muted text-muted-foreground border-0"
                      }
                    >
                      {s.status === "COMPLETED" ? "Completed" : s.status === "PROCESSING" ? "Processing" : "In progress"}
                    </Badge>
                    {s.confidence !== null && (
                      <span className="text-xs text-muted-foreground tabular-nums">{s.confidence}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
