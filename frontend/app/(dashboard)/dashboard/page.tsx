"use client"

import * as React from "react"
import { StatsGrid } from "@/components/features/dashboard/stats-grid"
import { useSession } from "next-auth/react"
import { Users, FileText, Clock, Activity } from "lucide-react"

export default function OverviewPage() {
  const { data: session } = useSession()
  const user = session?.user

  const stats = [
    { label: "Total Patients", value: "0", icon: Users },
    { label: "Clinical Notes", value: "0", icon: FileText },
    { label: "Hours Scribed", value: "0.0", icon: Clock },
    { label: "Active Sessions", value: "None", icon: Activity },
  ]

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Dashboard <span className="text-indigo-600 italic">Overview</span></h1>
        <p className="text-slate-500 font-medium text-sm">Welcome back, {user?.name || "Practitioner"}. Current Clinical Identity: {user?.role || "GUEST"}.</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
         <div className="md:col-span-2 space-y-6">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Recent Clinical Activity</h2>
            <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-white/50">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-50 italic">Zero Activity Synchronized</p>
            </div>
         </div>
         <div className="space-y-6">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">System Status</h2>
            <div className="space-y-3">
               {[
                 { l: "Backend API", s: "Operational", c: "text-emerald-500" },
                 { l: "Transcription", s: "Standby", c: "text-amber-500" },
                 { l: "Note Generation", s: "Operational", c: "text-emerald-500" },
                 { l: "Secure Storage", s: "Locked", c: "text-slate-400" }
               ].map(row => (
                 <div key={row.l} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{row.l}</span>
                    <span className={`text-[9px] font-bold uppercase ${row.c}`}>{row.s}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
