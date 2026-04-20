"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Activity, Search, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, ShieldAlert, Ban } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

interface DoctorStat {
  email: string
  name?: string
  totalSessions: number
  totalPrescriptions: number
  prescriptions7d: number
  sessionsLast30Days: number
  notesApproved: number
  notesRejected: number
  approvalRate: number | null
  lastActive: string | null
  active?: boolean
}

type SortKey = "name" | "totalPrescriptions" | "prescriptions7d" | "lastActive"

export function DoctorUsageTable({
  doctors,
  userMap,
}: {
  doctors: DoctorStat[]
  userMap: Record<string, { name: string; active: boolean }>
}) {
  const [query,   setQuery]   = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("totalPrescriptions")
  const [asc,     setAsc]     = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc(v => !v)
    else { setSortKey(key); setAsc(false) }
  }

  const enriched = doctors.map(d => ({ ...d, name: userMap[d.email]?.name ?? d.email }))

  const filtered = enriched
    .filter(d =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.email.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      let av: string | number | null, bv: string | number | null
      if (sortKey === "name")               { av = a.name;               bv = b.name }
      else if (sortKey === "totalPrescriptions") { av = a.totalPrescriptions; bv = b.totalPrescriptions }
      else if (sortKey === "prescriptions7d") { av = a.prescriptions7d;     bv = b.prescriptions7d }
      else                                  { av = a.lastActive ?? "";   bv = b.lastActive ?? "" }
      
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      return asc ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
    })

  if (doctors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Activity className="size-10 opacity-30" />
        <p className="text-sm font-medium">No activity data yet</p>
        <p className="text-xs">Doctor usage stats will appear here once clinical notes are generated.</p>
      </div>
    )
  }

  function SortBtn({ col }: { col: SortKey }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:text-foreground"
        onClick={() => toggleSort(col)}
      >
        <ArrowUpDown className="size-3 ml-1" />
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <InputGroup className="w-full md:w-80 h-9 bg-background/50">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput 
            placeholder="Search doctors..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-4">
                Doctor <SortBtn col="name" />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                Status
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                Prescriptions <SortBtn col="totalPrescriptions" />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                Last 7 Days <SortBtn col="prescriptions7d" />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right whitespace-nowrap">
                Last Active <SortBtn col="lastActive" />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(d => {
              const isActive = d.active ?? true
              return (
                <TableRow key={d.email} className="hover:bg-muted/20 group">
                  <TableCell className="pl-4 py-3">
                    <div className="font-bold text-xs uppercase tracking-tight">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">{d.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold h-5 px-2 border-transparent uppercase tracking-widest",
                      isActive ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                    )}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{d.totalPrescriptions}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-muted-foreground">{d.prescriptions7d}</TableCell>
                  <TableCell className="text-right pr-4 text-xs font-medium whitespace-nowrap">
                    {(() => {
                      if (!d.lastActive) return "—"
                      const date = new Date(d.lastActive)
                      const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
                      if (diff === 0) return <span className="text-emerald-600 font-bold">Today</span>
                      if (diff === 1) return "Yesterday"
                      return `${diff} days ago`
                    })()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Doctor Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                          <Pencil className="size-3.5 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                          <ShieldAlert className="size-3.5 mr-2" /> Usage Audit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs font-medium cursor-pointer text-destructive">
                          <Ban className="size-3.5 mr-2" /> Suspend Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Showing {filtered.length} of {doctors.length} doctors
        </p>
      </div>
    </div>
  )
}
