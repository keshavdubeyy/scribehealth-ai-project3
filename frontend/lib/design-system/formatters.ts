// ─────────────────────────────────────────────
// Data Display Formatters
// Source of truth: DESIGN_SYSTEM_HANDOFF.md §10
// ─────────────────────────────────────────────

/** en-IN locale for all date / number formatting. */
const LOCALE = "en-IN"

/**
 * Formats a date as "10 April 2026" (en-IN, long month).
 * Accepts ISO strings, Date objects, or timestamps.
 */
export function formatDate(value: string | Date | number): string {
  const date = new Date(value)
  return date.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" })
}

/**
 * Formats a duration in seconds as "MM:SS" (< 1hr) or "HH:MM:SS".
 * Used in the RecordingIndicator bar and session cards.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, "0")
  const ss = String(s).padStart(2, "0")
  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`
  return `${mm}:${ss}`
}

/**
 * Formats a duration in seconds as a human label, e.g. "5m 30s".
 * Used in session detail header badges.
 */
export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(" ")
}

/**
 * Formats a patient age for display: "28 yrs".
 * Returns null if age is not set.
 */
export function formatAge(age: number | null | undefined): string | null {
  if (age == null) return null
  return `${age} yrs`
}

/**
 * Generates a session name from patient name and recording start time.
 * Format: "PatientName_10Apr2026_0542PM"
 */
export function generateSessionName(patientName: string, date: Date = new Date()): string {
  const safeName = patientName.replace(/\s+/g, "")
  const d = date.toLocaleDateString(LOCALE, { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "")          // "10Apr2026"
    .replace(",", "")
  const t = date
    .toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: true })
    .replace(":", "")
    .replace(" ", "")            // "0542PM"
    .toUpperCase()
  return `${safeName}_${d}_${t}`
}
