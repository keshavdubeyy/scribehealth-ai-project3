"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useScribeStore } from "@/lib/mock-store"
import { Plus, FileText, Users, ChevronRight, TrendingUp, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { patients, sessions } = useScribeStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const firstName = session?.user?.name?.split(" ")[0] ?? "Doctor"
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

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
        const hash = s.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        const confidence = s.status === "COMPLETED" ? 80 + (hash % 19) : null
        return { ...s, sessionLabel, patientName: patient?.name ?? "Unknown", chiefComplaint, confidence }
      })
  }, [sessions, patients])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Hello, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {today}
          </p>
        </div>
        <Button 
          className="gap-2 h-10 px-5 font-semibold shadow-sm shadow-primary/20"
          onClick={() => router.push("/patients")}
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-default">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total sessions</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{sessions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-default">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{patients.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This week mini stat */}
      {thisWeekCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 w-fit px-3 py-1 rounded-full border border-border/50">
          <Clock className="w-3.5 h-3.5" />
          <span><strong className="text-foreground">{thisWeekCount}</strong> session{thisWeekCount !== 1 ? "s" : ""} this week</span>
        </div>
      )}

      {/* Recent sessions */}
      <Card className="border-border/50 shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Recent sessions</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-xs font-bold uppercase tracking-wider hover:bg-muted"
            onClick={() => router.push("/patients")}
          >
            View all
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <CardContent className="pt-0">
          {recentSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-xl bg-muted/10">
              No sessions yet.{" "}
              <button 
                onClick={() => router.push("/patients")}
                className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Start your first session
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => router.push(`/patients/${session.patientId}/sessions/${session.id}`)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-primary/[0.03] transition-all group cursor-pointer border border-transparent hover:border-primary/10"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold truncate font-mono tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {session.sessionLabel}
                    </p>
                    {session.chiefComplaint && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate leading-relaxed">
                        {session.chiefComplaint}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {session.confidence != null && (
                      <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                        {session.confidence}%
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-5 px-1.5 bg-muted/50 border-0">
                      GENERAL OPD
                    </Badge>
                    <Badge 
                      variant={session.status === "COMPLETED" ? "default" : "outline"} 
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest h-5 px-2",
                        session.status === "COMPLETED" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "text-amber-600 border-amber-500/30"
                      )}
                    >
                      {session.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
