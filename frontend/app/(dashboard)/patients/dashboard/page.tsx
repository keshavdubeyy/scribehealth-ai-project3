"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useScribeStore } from "@/lib/mock-store"
import { Plus, FileText, Users, ChevronRight, TrendingUp, Clock } from "lucide-react"
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

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentCount = sessions.filter(s => new Date(s.createdAt).getTime() > oneWeekAgo).length

  const recentSessions = React.useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => {
        const patient = patients.find(p => p.id === s.patientId)
        const sessionName = generateSessionName(patient?.name ?? "Unknown", new Date(s.createdAt))
        const chiefComplaint = s.soap?.s ? s.soap.s.split("\n")[0].trim() : null
        const hash = s.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        const confidence = s.status === "COMPLETED" ? 80 + (hash % 20) : null
        return { ...s, sessionName, patientName: patient?.name ?? "Unknown", chiefComplaint, confidence }
      })
  }, [sessions, patients])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
            Hello, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 w-full sm:w-auto justify-center h-9 px-4 text-[13px] font-medium"
          onClick={() => router.push("/patients")}
        >
          <Plus className="size-3.5" />
          New Session
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total sessions</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{sessions.length}</p>
              </div>
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <FileText className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Patients</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{patients.length}</p>
              </div>
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <Users className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-none bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">This week</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">{recentCount}</p>
              </div>
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent sessions ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">Recent sessions</h2>
          <Link
            href="/patients"
            className="text-[12px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            View all <ChevronRight className="size-3" />
          </Link>
        </div>

        <Card className="border border-border shadow-none overflow-hidden">
          {recentSessions.length === 0 ? (
            <CardContent className="py-14 text-center flex flex-col items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No sessions yet</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Start by adding a patient and creating a session.</p>
              </div>
              <Button size="sm" variant="outline" className="mt-1 h-8 text-xs" onClick={() => router.push("/patients")}>
                Add patient
              </Button>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {recentSessions.map((s, idx) => (
                <div
                  key={s.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors gap-2"
                  onClick={() => router.push(`/patients/${s.patientId}/sessions/${s.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] text-muted-foreground/40 tabular-nums w-4 shrink-0 group-hover:text-muted-foreground transition-colors">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-medium text-foreground truncate leading-tight">
                        {s.sessionName}
                      </span>
                      {s.chiefComplaint && (
                        <span className="text-[11px] text-muted-foreground truncate leading-tight">
                          {s.chiefComplaint}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0 pl-7 sm:pl-0">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium bg-primary/10 text-primary border-0 hover:bg-primary/10 h-5 px-2"
                    >
                      General OPD
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-medium border-0 h-5 px-2 ${
                        s.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                          : s.status === "PROCESSING"
                          ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.status === "COMPLETED" ? "Completed" : s.status === "PROCESSING" ? "Processing" : "In progress"}
                    </Badge>
                    {s.confidence !== null && (
                      <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                        {s.confidence}%
                      </span>
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
