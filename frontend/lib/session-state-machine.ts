import type { SessionStatus } from "@/lib/mock-store"

/**
 * FR-11: Valid state transitions for the consultation lifecycle.
 * Any transition not listed here is illegal and will throw.
 *
 *   SCHEDULED → IN_PROGRESS → RECORDED → TRANSCRIBED → UNDER_REVIEW → APPROVED
 *                                                                     ↘ REJECTED → UNDER_REVIEW
 *
 * Legacy statuses (IDLE, PROCESSING, COMPLETED) are kept permissive so
 * existing DB rows don't break.
 */
export const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  SCHEDULED:    ["IN_PROGRESS"],
  IN_PROGRESS:  ["RECORDED"],
  RECORDED:     ["TRANSCRIBED"],
  TRANSCRIBED:  ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED:     [],                                          // terminal — locked forever
  REJECTED:     ["UNDER_REVIEW"],                          // regenerate path
  // legacy — permissive so old DB rows aren't blocked
  IDLE:         ["IN_PROGRESS", "SCHEDULED", "RECORDED", "TRANSCRIBED", "UNDER_REVIEW"],
  PROCESSING:   ["TRANSCRIBED", "UNDER_REVIEW", "IDLE"],
  COMPLETED:    ["APPROVED"],
}

export function canTransition(from: SessionStatus, to: SessionStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to)
}

export function assertTransition(from: SessionStatus, to: SessionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal state transition: ${from} → ${to}`)
  }
}
