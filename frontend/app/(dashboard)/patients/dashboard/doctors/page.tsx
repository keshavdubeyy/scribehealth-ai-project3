import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { DoctorUsageTable } from "@/components/features/dashboard/doctor-usage-table"
import { Stethoscope } from "lucide-react"

import { createServiceClient } from "@/utils/supabase/service"

async function getDoctors(orgId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", orgId)
    .eq("role", "DOCTOR")
  
  if (error) {
    console.error("Failed to fetch doctors:", error.message)
    return []
  }
  return data ?? []
}

import { getDoctorStatsLogic } from "@/lib/services/doctor-stats"

import { PageHeader } from "@/components/page-header"

export default async function AdminDoctorsPage() {
  const session = await auth()
  const token   = session?.user?.accessToken
  const role    = session?.user?.role
  const orgId   = session?.user?.organizationId

  if (role !== "ADMIN" || !token) redirect("/patients/dashboard")

  const [doctors, statsArray] = await Promise.all([
    getDoctors(orgId || ""),
    orgId ? getDoctorStatsLogic(orgId).catch(() => []) : Promise.resolve([]),
  ])

  // Convert stats array to a case-insensitive map for easier lookup
  const statsMap = new Map<string, any>()
  for (const s of (statsArray as any[])) {
    statsMap.set(s.email.toLowerCase(), s)
  }

  // Build final list scoped ONLY to doctors returned by getDoctors
  const allStats = doctors.map(d => {
    const emailKey = d.email.toLowerCase()
    const s = statsMap.get(emailKey)

    return {
      email: d.email,
      name:  d.name,
      totalSessions:      s?.totalSessions      ?? 0,
      totalPrescriptions: s?.totalPrescriptions ?? 0,
      prescriptions7d:    s?.prescriptions7d    ?? 0,
      sessionsLast30Days: s?.sessionsLast30Days ?? 0,
      notesApproved:      s?.notesApproved      ?? 0,
      notesRejected:      s?.notesRejected      ?? 0,
      approvalRate:       s?.approvalRate       ?? null,
      lastActive:         s?.lastActive         ?? null,
      active:             (d as any).active     ?? true,
    }
  })

  // User map for display names (fallback)
  const userMap: Record<string, { name: string; active: boolean }> = {}
  for (const d of doctors) {
    userMap[d.email] = { name: d.name, active: (d as any).active ?? true }
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader 
          title="Doctors" 
          description="Usage statistics for all doctors in your organization."
        />
        <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
          {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DoctorUsageTable doctors={allStats} userMap={userMap} />
    </div>
  )
}
