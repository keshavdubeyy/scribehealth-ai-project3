// ─────────────────────────────────────────────
// ScribeHealth AI — Core Data Types
// Source of truth: DESIGN_SYSTEM_HANDOFF.md §13
// ─────────────────────────────────────────────

// ── Enums ─────────────────────────────────────

export type NoteTemplate =
  | "general_opd"
  | "mental_health_soap"
  | "physiotherapy"
  | "pediatric"
  | "cardiology"
  | "surgical_followup"

export type SessionStatus = "processing" | "completed"

export type UserRole = "DOCTOR" | "ADMIN"

// ── Note Fields (per template) ─────────────────

export interface GeneralOpdNote {
  chief_complaint: string
  history_of_present_illness: string
  past_medical_history: string
  medications: string
  allergies: string
  review_of_systems: string
  physical_examination: string
  assessment: string
  plan: string
}

export interface MentalHealthSoapNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  risk_assessment: string
  follow_up: string
}

export interface PhysiotherapyNote {
  chief_complaint: string
  history: string
  observation: string
  range_of_motion: string
  special_tests: string
  assessment: string
  treatment_given: string
  home_exercise_program: string
  plan: string
}

export interface PediatricNote {
  chief_complaint: string
  history: string
  immunization_history: string
  developmental_history: string
  physical_examination: string
  assessment: string
  plan: string
  parental_counseling: string
}

export interface CardiologyNote {
  chief_complaint: string
  history_of_present_illness: string
  cardiac_history: string
  risk_factors: string
  medications: string
  physical_examination: string
  ecg_findings: string
  investigation_results: string
  assessment: string
  plan: string
}

export interface SurgicalFollowupNote {
  procedure_performed: string
  date_of_surgery: string
  chief_complaint: string
  wound_assessment: string
  current_medications: string
  complications: string
  examination_findings: string
  assessment: string
  plan: string
  return_precautions: string
}

export type NoteFields =
  | GeneralOpdNote
  | MentalHealthSoapNote
  | PhysiotherapyNote
  | PediatricNote
  | CardiologyNote
  | SurgicalFollowupNote
  | Record<string, string>   // fallback for partial/unknown templates

export interface ChronicCondition {
  name: string
  icdCode?: string
  diagnosedYear?: number
}

export interface Allergy {
  substance: string
  severity: "mild" | "moderate" | "severe"
  reaction?: string
}

export interface EmergencyContact {
  name: string
  relationship?: string
  phone: string
}

export interface InsuranceDetails {
  provider: string
  policyNumber: string
  validUntil?: string
}

export interface Session {
  id: string
  doctor_id: string
  patient_id: string | null
  name: string                  // e.g. "PatientName_10Apr2026_0542PM"
  chief_complaint: string | null
  transcript: string | null
  note: NoteFields | null
  template: NoteTemplate
  status: SessionStatus
  duration: number              // seconds
  ai_confidence: number         // 0.0 – 1.0
  audio_url: string | null
  created_at: string            // ISO timestamp
  updated_at: string
}

export interface SessionEdit {
  id: string
  session_id: string
  field_path: string            // e.g. "subjective" or "medications[0].dose"
  old_value: string | null
  new_value: string | null
  edited_at: string
}

export interface Patient {
  id: string
  doctor_id: string
  name: string
  age: number | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

export interface Doctor {
  id: string
  user_id: string               // NextAuth / Clerk user ID
  name: string
  specialty: string | null
  clinic_name: string | null
  email: string
  created_at: string
}

// ── Safe zone uses percentage-based coordinates ─

export interface SafeZone {
  x: number       // % from left
  y: number       // % from top
  width: number   // % of image width
  height: number  // % of image height
}

export interface PrescriptionTemplate {
  id: string
  doctor_id: string
  image_url: string
  safe_zone: SafeZone
  font_size: number             // pt, 7–16
  line_height: number           // pt, 10–30
  created_at: string
  updated_at: string
}

// ── Prescription (runtime, not persisted as a model) ──

export type MedicineFrequency =
  | "Once daily"
  | "Twice daily"
  | "Three times daily"
  | "Four times daily"
  | "Every 8 hours"
  | "Every 12 hours"
  | "At bedtime"
  | "As needed (SOS)"

export type MedicineTiming =
  | "After food"
  | "Before food"
  | "With food"
  | "Empty stomach"
  | "At bedtime"
  | "Any time"

export interface Medicine {
  name: string
  dose: string
  frequency: MedicineFrequency | string
  duration: string
  timing: MedicineTiming | string
}

export interface Prescription {
  patient_name: string
  patient_age: string
  chief_complaint: string
  diagnosis: string
  medicines: Medicine[]
  next_steps: string[]
}
