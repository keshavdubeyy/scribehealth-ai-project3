// ─────────────────────────────────────────────
// Note Template Definitions
// Source of truth: DESIGN_SYSTEM_HANDOFF.md §6, §13
// ─────────────────────────────────────────────

import type { NoteTemplate } from "@/lib/types"

export interface TemplateField {
  key: string
  label: string
  placeholder?: string
}

export interface TemplateDefinition {
  id: NoteTemplate
  label: string
  fields: TemplateField[]
}

export const NOTE_TEMPLATES: TemplateDefinition[] = [
  {
    id: "general_opd",
    label: "General OPD",
    fields: [
      { key: "chief_complaint",              label: "Chief Complaint" },
      { key: "history_of_present_illness",   label: "History of Present Illness" },
      { key: "past_medical_history",         label: "Past Medical History" },
      { key: "medications",                  label: "Current Medications" },
      { key: "allergies",                    label: "Allergies" },
      { key: "review_of_systems",            label: "Review of Systems" },
      { key: "physical_examination",         label: "Physical Examination" },
      { key: "assessment",                   label: "Assessment" },
      { key: "plan",                         label: "Plan" },
    ],
  },
  {
    id: "mental_health_soap",
    label: "Mental Health (SOAP)",
    fields: [
      { key: "subjective",      label: "Subjective" },
      { key: "objective",       label: "Objective" },
      { key: "assessment",      label: "Assessment" },
      { key: "plan",            label: "Plan" },
      { key: "risk_assessment", label: "Risk Assessment" },
      { key: "follow_up",       label: "Follow-up" },
    ],
  },
  {
    id: "physiotherapy",
    label: "Physiotherapy",
    fields: [
      { key: "chief_complaint",      label: "Chief Complaint" },
      { key: "history",              label: "History" },
      { key: "observation",          label: "Observation" },
      { key: "range_of_motion",      label: "Range of Motion" },
      { key: "special_tests",        label: "Special Tests" },
      { key: "assessment",           label: "Assessment" },
      { key: "treatment_given",      label: "Treatment Given" },
      { key: "home_exercise_program",label: "Home Exercise Program" },
      { key: "plan",                 label: "Plan" },
    ],
  },
  {
    id: "pediatric",
    label: "Pediatric",
    fields: [
      { key: "chief_complaint",        label: "Chief Complaint" },
      { key: "history",                label: "History" },
      { key: "immunization_history",   label: "Immunization History" },
      { key: "developmental_history",  label: "Developmental History" },
      { key: "physical_examination",   label: "Physical Examination" },
      { key: "assessment",             label: "Assessment" },
      { key: "plan",                   label: "Plan" },
      { key: "parental_counseling",    label: "Parental Counseling" },
    ],
  },
  {
    id: "cardiology",
    label: "Cardiology",
    fields: [
      { key: "chief_complaint",              label: "Chief Complaint" },
      { key: "history_of_present_illness",   label: "History of Present Illness" },
      { key: "cardiac_history",              label: "Cardiac History" },
      { key: "risk_factors",                 label: "Risk Factors" },
      { key: "medications",                  label: "Medications" },
      { key: "physical_examination",         label: "Physical Examination" },
      { key: "ecg_findings",                 label: "ECG Findings" },
      { key: "investigation_results",        label: "Investigation Results" },
      { key: "assessment",                   label: "Assessment" },
      { key: "plan",                         label: "Plan" },
    ],
  },
  {
    id: "surgical_followup",
    label: "Surgical Follow-up",
    fields: [
      { key: "procedure_performed",  label: "Procedure Performed" },
      { key: "date_of_surgery",      label: "Date of Surgery" },
      { key: "chief_complaint",      label: "Chief Complaint" },
      { key: "wound_assessment",     label: "Wound Assessment" },
      { key: "current_medications",  label: "Current Medications" },
      { key: "complications",        label: "Complications" },
      { key: "examination_findings", label: "Examination Findings" },
      { key: "assessment",           label: "Assessment" },
      { key: "plan",                 label: "Plan" },
      { key: "return_precautions",   label: "Return Precautions" },
    ],
  },
]

/** Lookup a template definition by ID. Falls back to general_opd. */
export function getTemplate(id: NoteTemplate): TemplateDefinition {
  return NOTE_TEMPLATES.find((t) => t.id === id) ?? NOTE_TEMPLATES[0]
}

/** Map of template ID → human-readable label for dropdowns/badges. */
export const TEMPLATE_LABELS: Record<NoteTemplate, string> = Object.fromEntries(
  NOTE_TEMPLATES.map((t) => [t.id, t.label])
) as Record<NoteTemplate, string>
