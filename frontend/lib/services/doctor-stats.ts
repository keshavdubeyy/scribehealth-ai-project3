import { createServiceClient } from "@/utils/supabase/service"

export async function getDoctorStatsLogic(organizationId: string) {
  const supabase = createServiceClient()

  // Fetch sessions scoped to this org
  const { data: sessions, error: sessErr } = await supabase
    .from("sessions")
    .select("doctor_email, created_at, organization_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5000)

  if (sessErr) throw sessErr

  // Fetch audit logs scoped to this org
  const { data: logs, error: logErr } = await supabase
    .from("audit_logs")
    .select("user_email, action, created_at")
    .eq("organization_id", organizationId)
    .in("action", [
      "note_approved",
      "note_rejected",
      "session_created",
      "prescription_generated",
      "prescription_shared"
    ])
    .order("created_at", { ascending: false })
    .limit(5000)

  // Aggregate by doctor_email (normalized to lowercase)
  const now = Date.now()
  const day30 = now - 30 * 24 * 60 * 60 * 1000
  const day7  = now - 7 * 24 * 60 * 60 * 1000

  const statsMap = new Map<string, {
    email: string
    totalSessions: number
    totalPrescriptions: number
    prescriptions7d: number
    sessionsLast30Days: number
    notesApproved: number
    notesRejected: number
    lastActive: string | null
  }>()

  // Initialize with session data
  for (const s of sessions ?? []) {
    const email = (s.doctor_email as string).toLowerCase()
    if (!statsMap.has(email)) {
      statsMap.set(email, { 
        email, 
        totalSessions: 0, 
        totalPrescriptions: 0, 
        prescriptions7d: 0,
        sessionsLast30Days: 0, 
        notesApproved: 0, 
        notesRejected: 0, 
        lastActive: null 
      })
    }
    const entry = statsMap.get(email)!
    entry.totalSessions++
    if (new Date(s.created_at).getTime() > day30) entry.sessionsLast30Days++
    if (!entry.lastActive || s.created_at > entry.lastActive) entry.lastActive = s.created_at
  }

  // Enrich with audit log data (Prescriptions, Approvals, Activity)
  for (const log of logs ?? []) {
    const email = (log.user_email as string).toLowerCase()
    if (!statsMap.has(email)) {
      statsMap.set(email, { 
        email, 
        totalSessions: 0, 
        totalPrescriptions: 0, 
        prescriptions7d: 0,
        sessionsLast30Days: 0, 
        notesApproved: 0, 
        notesRejected: 0, 
        lastActive: null 
      })
    }
    const entry = statsMap.get(email)!
    
    if (log.action === "note_approved") entry.notesApproved++
    if (log.action === "note_rejected") entry.notesRejected++
    
    if (log.action === "prescription_generated" || log.action === "prescription_shared") {
      entry.totalPrescriptions++
      if (new Date(log.created_at).getTime() > day7) entry.prescriptions7d++
    }

    if (!entry.lastActive || log.created_at > entry.lastActive) {
      entry.lastActive = log.created_at
    }
  }

  return Array.from(statsMap.values()).map(e => ({
    ...e,
    approvalRate: (e.notesApproved + e.notesRejected) > 0
      ? Math.round((e.notesApproved / (e.notesApproved + e.notesRejected)) * 100)
      : null,
  }))
}
