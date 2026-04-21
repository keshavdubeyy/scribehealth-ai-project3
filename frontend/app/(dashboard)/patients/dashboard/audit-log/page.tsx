"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, Search, ShieldCheck, Download, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

interface AuditLog {
  id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown>
  created_at: string
}

const ACTION_STYLES: Record<string, { label: string; class: string }> = {
  note_approved:    { label: "Approved",     class: "bg-emerald-500/10 text-emerald-700" },
  note_rejected:    { label: "Rejected",     class: "bg-destructive/10 text-destructive" },
  note_edited:      { label: "Edited",       class: "bg-blue-500/10 text-blue-700" },
  note_generated:   { label: "Generated",    class: "bg-violet-500/10 text-violet-700" },
  note_regenerated: { label: "Regenerated",  class: "bg-amber-500/10 text-amber-700" },
  session_created:  { label: "Session",      class: "bg-sky-500/10 text-sky-700" },
  patient_created:        { label: "Patient",      class: "bg-teal-500/10 text-teal-700" },
  prescription_generated: { label: "Rx Generated",  class: "bg-sky-500/10 text-sky-700" },
  prescription_shared:    { label: "Rx Shared",     class: "bg-indigo-500/10 text-indigo-700" },
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action]
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold h-5 uppercase tracking-widest border-transparent", style?.class ?? "bg-muted/50 text-muted-foreground/70")}>
      {style?.label ?? action}
    </Badge>
  )
}

import { PageHeader } from "@/components/page-header"

export default function AuditLogPage() {
  const [logs, setLogs]           = React.useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch]       = React.useState("")

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/audit?limit=200")
      if (!res.ok) throw new Error("Failed to fetch")
      const { logs: data } = await res.json() as { logs: AuditLog[] }
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return logs
    return logs.filter(l =>
      l.user_email.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity_id.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q)
    )
  }, [logs, search])

  const exportCsv = React.useCallback(() => {
    const header = ["timestamp", "user_email", "action", "entity_type", "entity_id", "metadata"]
    const rows = filtered.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.user_email,
      l.action,
      l.entity_type,
      l.entity_id,
      JSON.stringify(l.metadata).replace(/"/g, '""'),
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `audit-log-${format(new Date(), "yyyyMMdd-HHmm")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <PageHeader 
        title="Audit Log" 
        description="Immutable record of every system action — approvals, rejections, note edits, and more."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-9 h-9"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 font-bold px-3" 
            onClick={fetchLogs} 
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline" 
            size="sm"
            className="gap-2 font-bold px-3"
            onClick={exportCsv}
            disabled={isLoading || filtered.length === 0}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-[170px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-sm text-muted-foreground">
                    {search ? "No entries match your search." : "No audit log entries yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {format(new Date(log.created_at), "dd MMM yy, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate">
                      {log.user_email}
                    </TableCell>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-muted-foreground">{log.entity_type}/</span>
                      <span className="font-mono">{log.entity_id.slice(0, 8)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[240px] truncate">
                      {Object.keys(log.metadata).length > 0
                        ? Object.entries(log.metadata)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
                            .join(" · ")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && filtered.length > 0 && (
        <div className="flex justify-end pt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Showing {filtered.length} of {logs.length} entries
          </p>
        </div>
      )}
    </div>
  )
}
