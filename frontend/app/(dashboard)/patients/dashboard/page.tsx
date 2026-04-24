"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useScribeStore } from "@/lib/mock-store"
import {
  FileText,
  Users,
  ArrowRight,
  Plus,
  Search,
  Clock,
  Sparkles,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { AdminMetricsPanel } from "@/components/features/dashboard/admin-metrics-panel"
import { useUserRole } from "@/hooks/use-user-role"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { isAdmin, isLoading: roleLoading } = useUserRole()
  const { patients, sessions, fetchPatients, fetchAllSessions } = useScribeStore()
  const [mounted, setMounted] = React.useState(false)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    fetchPatients()
    fetchAllSessions()
  }, [fetchPatients, fetchAllSessions])

  const thisWeekCount = React.useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return sessions.filter(s => new Date(s.createdAt).getTime() > oneWeekAgo).length
  }, [sessions])

  const recentSessions = React.useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => {
        const patient = patients.find(p => p.id === s.patientId)
        const createdAt = new Date(s.createdAt)
        const sessionLabel = `${patient?.name.replace(/\s+/g, "") || "Unknown"}_${format(createdAt, "ddMMMyyyy_hhmma").replace(" ", "").toUpperCase()}`
        const chiefComplaint = s.soap?.s ? s.soap.s.split("\n")[0].trim() : null
        return { ...s, sessionLabel, patientName: patient?.name ?? "Unknown", chiefComplaint }
      })
  }, [sessions, patients])

  const filteredSessions = React.useMemo(() =>
    recentSessions.filter(s =>
      s.sessionLabel.toLowerCase().includes(search.toLowerCase()) ||
      s.patientName.toLowerCase().includes(search.toLowerCase())
    ), [recentSessions, search])

  if (!mounted || roleLoading) return null

  if (isAdmin) {
    return (
      <div className="flex flex-col w-full animate-in fade-in duration-500">
        <PageHeader />
        <AdminMetricsPanel />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 flex flex-col w-full animate-in fade-in duration-500 pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader />
        <Button
          size="default"
          className="gap-2 font-semibold"
          onClick={() => router.push("/patients")}
        >
          <Sparkles className="size-4" />
          New Session
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">+{thisWeekCount} this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Seen</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered directory</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 px-6 h-14">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Recent Activity</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Find session..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs font-semibold"
              onClick={() => router.push("/patients/sessions")}
            >
              View All <ArrowRight className="size-3" />
            </Button>
          </div>
        </CardHeader>

        {filteredSessions.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-sm font-semibold">No sessions recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
              Start a recording with a patient to generate your first clinical note
            </p>
            <Button variant="outline" size="sm" className="mt-6 gap-2" onClick={() => router.push("/patients")}>
              <Plus className="size-4" />
              Start your first session
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/patients/${s.patientId}/sessions/${s.id}`)}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <div className="min-w-0 pr-6">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold truncate font-mono tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {s.sessionLabel}
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-muted h-5 px-2 flex items-center rounded-full font-medium tabular-nums shrink-0">
                      {format(new Date(s.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {s.chiefComplaint && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                      {s.chiefComplaint}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{s.patientName}</span>
                  </div>
                  <Badge
                    variant={s.status === "COMPLETED" || s.status === "APPROVED" ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] font-semibold h-5 px-2",
                      s.status === "COMPLETED" || s.status === "APPROVED"
                        ? "bg-emerald-500 text-white"
                        : "text-amber-600 border-amber-500/30"
                    )}
                  >
                    {s.status}
                  </Badge>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
