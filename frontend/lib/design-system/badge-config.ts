// ─────────────────────────────────────────────
// Badge & Status Configuration
// Source of truth: DESIGN_SYSTEM_HANDOFF.md §14
// ─────────────────────────────────────────────

import type { SessionStatus, NoteTemplate } from "@/lib/types"

// ── Session Status ──────────────────────────────

export interface BadgeConfig {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline" | "ghost"
  /** Optional Tailwind classes for colour overrides not covered by variant. */
  className?: string
}

export const SESSION_STATUS_BADGE: Record<SessionStatus, BadgeConfig> = {
  completed: {
    label: "Completed",
    variant: "default",       // filled primary teal
  },
  processing: {
    label: "Processing",
    variant: "outline",       // outline, inherits text colour
  },
}

// ── AI Confidence ───────────────────────────────

export interface ConfidenceBadge extends BadgeConfig {
  min: number   // inclusive lower bound (0–100)
  max: number   // inclusive upper bound
}

export const CONFIDENCE_BADGES: ConfidenceBadge[] = [
  {
    min: 80, max: 100,
    label: "High confidence",
    variant: "default",
    className: "bg-green-500 hover:bg-green-500 text-white",
  },
  {
    min: 60, max: 79,
    label: "Medium confidence",
    variant: "secondary",
    className: "bg-yellow-400 hover:bg-yellow-400 text-yellow-900",
  },
  {
    min: 0, max: 59,
    label: "Low confidence",
    variant: "destructive",
  },
]

/**
 * Returns the badge config for a given confidence float (0.0 – 1.0).
 * Pass `session.ai_confidence` directly.
 */
export function getConfidenceBadge(score: number): ConfidenceBadge {
  const pct = Math.round(score * 100)
  return (
    CONFIDENCE_BADGES.find((b) => pct >= b.min && pct <= b.max) ??
    CONFIDENCE_BADGES[CONFIDENCE_BADGES.length - 1]
  )
}

// ── Note Template Badges ────────────────────────

import { TEMPLATE_LABELS } from "@/lib/design-system/note-templates"

export function getTemplateBadge(template: NoteTemplate): BadgeConfig {
  return {
    label: TEMPLATE_LABELS[template] ?? template,
    variant: "secondary",
  }
}

// ── Medicine Dropdown Options ───────────────────
// Source: DESIGN_SYSTEM_HANDOFF.md §6 (Prescription Generator)

export const MEDICINE_FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 8 hours",
  "Every 12 hours",
  "At bedtime",
  "As needed (SOS)",
] as const

export const MEDICINE_TIMING_OPTIONS = [
  "After food",
  "Before food",
  "With food",
  "Empty stomach",
  "At bedtime",
  "Any time",
] as const
