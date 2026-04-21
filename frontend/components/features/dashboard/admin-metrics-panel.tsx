"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Users, UserCheck, UserX, ShieldCheck, BarChart2,
  ThumbsUp, ThumbsDown, Building2, FileText,
  Plus, ArrowUpRight, Clock, MoreHorizontal,
  Calendar, ChevronRight, TrendingUp,
  Loader2
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

const API = "/api"

interface Stats {
  totalUsers: number
  totalDoctors: number
  totalAdmins: number
  activeUsers: number
  pendingUsers: number
  organizationName?: string
}

interface AuditEntry { action: string; created_at: string; user_email: string }

interface UsageMetrics {
  totalPrescriptions: number
  active7d: number
  inactiveDocs: number
  trendData7d: any[]
  trendData30d: any[]
  doctorActivity: { name: string; email: string; status: 'Active' | 'Inactive'; prescriptions: number; lastActive: string; lastActiveTs: number }[]
}

const chartConfig = {
  count: {
    label: "Prescriptions",
    color: "hsl(var(--primary))",
  }
}

export function AdminMetricsPanel() {
  const { data: session }   = useSession()
  const token               = session?.user?.accessToken
  const orgName             = session?.user?.organizationName || "Your Organization"

  const [stats,   setStats]       = useState<Stats | null>(null)
  const [metrics, setMetrics]     = useState<UsageMetrics | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

  useEffect(() => {
    if (!token) return

    const safeJson = (r: Response) => {
      if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return null
      return r.json().catch(() => null)
    }

    Promise.all([
      fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(safeJson),
      fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(safeJson),
      fetch("/api/audit?limit=2000").then(r => {
        if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return { logs: [] }
        return r.json().catch(() => ({ logs: [] }))
      }),
    ]).then(([s, users, audit]) => {
      const logs: AuditEntry[] = audit.logs ?? []
      const doctors            = (users ?? []).filter((u: any) => u.role === "DOCTOR")
      
      const now   = Date.now()
      const day7  = now - 7  * 24 * 60 * 60 * 1000
      const day30 = now - 30 * 24 * 60 * 60 * 1000

      const getTrend = (days: number) => {
        const data: Record<string, number> = {}
        const start = now - days * 24 * 60 * 60 * 1000
        for (let i = 0; i <= days; i++) {
          const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          data[d] = 0
        }
        logs.filter(l => l.action === "prescription_generated" && new Date(l.created_at).getTime() > start)
            .forEach(l => {
              const d = new Date(l.created_at).toISOString().split('T')[0]
              if (data[d] !== undefined) data[d]++
            })
        return Object.entries(data).map(([date, count]) => ({ 
          date: new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), 
          count 
        })).reverse()
      }

      const activity = doctors.map((d: any) => {
        const docLogs        = logs.filter(l => l.user_email === d.email)
        const prescriptions   = docLogs.filter(l => l.action === "prescription_generated").length
        const prescriptions7d = docLogs.filter(l => l.action === "prescription_generated" && new Date(l.created_at).getTime() > day7).length
        const lastLog        = docLogs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        const lastActiveTs   = lastLog ? new Date(lastLog.created_at).getTime() : 0
        const isActive7d     = lastActiveTs > day7
        
        return {
          name: d.name,
          email: d.email,
          status: isActive7d ? 'Active' : 'Inactive' as 'Active' | 'Inactive',
          prescriptions,
          prescriptions7d,
          lastActiveTs,
          lastActive: lastLog ? formatRelativeTime(lastLog.created_at) : 'Never'
        }
      })

      setStats(s)
      setMetrics({
        totalPrescriptions: logs.filter(l => l.action === "prescription_generated").length,
        active7d: activity.filter((a: any) => a.lastActiveTs > day7).length,
        inactiveDocs: activity.filter((a: any) => a.status === 'Inactive').length,
        trendData7d: getTrend(7),
        trendData30d: getTrend(30),
        doctorActivity: activity.sort((a: any, b: any) => b.lastActiveTs - a.lastActiveTs).slice(0, 5)
      })
    })
  }, [token])

  // ── Real-time updates ─────────────────────────────────────────
  useEffect(() => {
    const { createClient } = require("@/utils/supabase/client")
    const supabase = createClient()
    
    const channel = supabase
      .channel('audit-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload: any) => {
        const newLog = payload.new as AuditEntry
        if (newLog.action === "prescription_generated") {
          // Update local state immediately for real-time feel
          setMetrics(prev => {
            if (!prev) return prev
            const day7 = Date.now() - 7 * 24 * 60 * 60 * 1000
            const is7d  = new Date(newLog.created_at).getTime() > day7
            
            return {
              ...prev,
              totalPrescriptions: prev.totalPrescriptions + 1,
              active7d: is7d ? prev.active7d : prev.active7d, // approx
              doctorActivity: prev.doctorActivity.map(d => 
                d.email === newLog.user_email 
                  ? { ...d, prescriptions: d.prescriptions + 1, lastActive: 'Just now', status: 'Active' } 
                  : d
              )
            }
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const chartData = useMemo(() => 
    timeRange === '7d' ? metrics?.trendData7d : metrics?.trendData30d, 
  [timeRange, metrics])

  if (!stats || !metrics) return <div className="h-60 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin size-4" /> Loading dashboard...</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{orgName}</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Administration Hub</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/patients/dashboard/users" className="gap-2">
            <Plus className="size-4" />
            Invite Doctor
          </Link>
        </Button>
      </div>

      {/* ── Key Metrics (Reusing Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground mt-1">Staff accounts</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active (7d)</CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.active7d}</div>
            <p className="text-xs text-muted-foreground mt-1">Engagement high</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.inactiveDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <FileText className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Total output</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Dashboard Layout (Full Width) ── */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Trend Graph using ChartContainer */}
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 px-6 h-14">
            <div className="flex items-center gap-2">
              <BarChart2 className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Usage Trend</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button 
                variant={timeRange === '7d' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 text-[11px] font-bold px-3"
                onClick={() => setTimeRange('7d')}
              >7 Days</Button>
              <Button 
                variant={timeRange === '30d' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 text-[11px] font-bold px-3"
                onClick={() => setTimeRange('30d')}
              >30 Days</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-2 pb-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px] fill-muted-foreground"
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  className="text-[10px] fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Table using standard shadcn/ui Table */}
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 px-6 h-14">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Doctor Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="px-6">Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Prescriptions</TableHead>
                  <TableHead className="text-center">Last 7 Days</TableHead>
                  <TableHead className="text-center">Last Active</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.doctorActivity.map((doc, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6 py-3">
                      <div className="font-medium text-foreground text-xs">{doc.name}</div>
                      <div className="text-[10px] text-muted-foreground">{doc.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'Active' ? 'default' : 'secondary'} className="rounded-md text-[10px] h-5 px-1.5 font-bold">
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{doc.prescriptions}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-blue-600 font-bold">{doc.prescriptions7d}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground italic">
                      {doc.lastActive}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-[11px]">Manage {doc.name}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/dashboard/users?email=${doc.email}`} className="text-xs">
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Export Stats</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-destructive">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t text-center">
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold gap-1">
                <Link href="/patients/dashboard/doctors">
                  View All Doctors <ChevronRight className="size-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInDays = Math.floor(diffInSecs / 86400)

  if (diffInSecs < 60) return 'Just now'
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
