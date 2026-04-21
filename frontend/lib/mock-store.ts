"use client"

import { create } from "zustand"
import { createClient } from "@/utils/supabase/client"
import { logAudit } from "@/lib/audit"
import { assertTransition } from "@/lib/session-state-machine"

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

export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  email?: string
  phone?: string
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

// Full 7-stage lifecycle (FR-11). Old values kept for backward compat with existing DB rows.
export type SessionStatus =
  | "SCHEDULED"    // session created, recording not started
  | "IN_PROGRESS"  // recording in progress
  | "RECORDED"     // recording stopped, transcription pending
  | "TRANSCRIBED"  // transcript ready, note generation pending
  | "UNDER_REVIEW" // note generated, awaiting doctor approval
  | "APPROVED"     // doctor approved — note is locked
  | "REJECTED"     // doctor rejected — flagged for regeneration
  // legacy statuses for backward compat
  | "IDLE" | "PROCESSING" | "COMPLETED"

// FR-05: structured medical entities extracted from transcript
export interface MedicalEntities {
  symptoms:      string[]
  diagnoses:     string[]
  medications:   Array<{ name: string; dosage: string; frequency: string }>
  allergies:     Array<{ substance: string; severity: string }>
  vitals:        Array<{ metric: string; value: string; unit: string }>
  treatmentPlans: string[]
}

export interface Session {
  id: string
  patientId: string
  createdAt: string
  status: SessionStatus
  soap?: Record<string, string>
  transcription?: string
  audioUrl?: string
  entities?: MedicalEntities
  edits?: Array<{
    field: string
    oldValue: string
    newValue: string
    timestamp: string
  }>
  prescription?: {
    diagnosis: string
    medicines: Array<{
      id: string
      name: string
      dose: string
      frequency: string
      duration: string
      timing: string
    }>
    nextSteps: string
  }
}

export interface SafeZone {
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
  fontSizePt: number
  lineHeightPt: number
}

export interface PrescriptionTemplate {
  id: string
  imagePath: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  safeZone: SafeZone
}

interface ScribeStore {
  userEmail: string | null
  setUserEmail: (email: string) => void

  patients: Patient[]
  sessions: Session[]

  fetchPatients: () => Promise<void>
  addPatient: (patient: Omit<Patient, "id">) => Promise<string>
  updatePatientProfile: (id: string, data: Omit<Patient, "id" | "name" | "age" | "gender">) => Promise<void>
  deletePatient: (id: string) => Promise<void>
  fetchAllSessions: () => Promise<void>
  fetchSessions: (patientId: string) => Promise<void>
  addSession: (patientId: string) => Promise<string>
  updateSession: (id: string, data: Partial<Session>) => Promise<void>
  transitionSession: (id: string, status: SessionStatus, extraData?: Omit<Partial<Session>, "status">) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  getPatient: (id: string) => Patient | undefined
  getSessions: (patientId: string) => Session[]

  prescriptionTemplate: PrescriptionTemplate | null
  fetchPrescriptionTemplate: () => Promise<void>
  setPrescriptionTemplate: (template: PrescriptionTemplate | null) => void
}

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id:            row.id as string,
    patientId:     (row.patient_id as string) ?? "",
    createdAt:     row.created_at as string,
    status:        row.status as Session["status"],
    soap:          row.soap as Session["soap"] ?? undefined,
    transcription: (row.transcription as string) ?? undefined,
    audioUrl:      (row.audio_url as string) ?? undefined,
    entities:      row.entities as Session["entities"] ?? undefined,
    edits:         (row.edits as Session["edits"]) ?? [],
    prescription:  row.prescription as Session["prescription"] ?? undefined,
  }
}

export const useScribeStore = create<ScribeStore>()((set, get) => ({
  userEmail: null,

  setUserEmail: (email: string) => {
    set({ userEmail: email })
    get().fetchPatients()
    get().fetchAllSessions()
    get().fetchPrescriptionTemplate()
  },

  patients: [],
  sessions: [],

  fetchPatients: async () => {
    const email = get().userEmail
    if (!email) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, age, gender, email, phone, chronic_conditions, allergies, emergency_contact, insurance_details")
      .eq("doctor_email", email)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    set({
      patients: (data ?? []).map(row => ({
        id:                row.id,
        name:              row.name,
        age:               row.age,
        gender:            row.gender,
        email:             (row.email as string)             ?? undefined,
        phone:             (row.phone as string)             ?? undefined,
        chronicConditions: (row.chronic_conditions as ChronicCondition[]) ?? undefined,
        allergies:         (row.allergies as Allergy[])                   ?? undefined,
        emergencyContact:  (row.emergency_contact as EmergencyContact)    ?? undefined,
        insuranceDetails:  (row.insurance_details as InsuranceDetails)    ?? undefined,
      })),
    })
  },

  addPatient: async (data) => {
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? "Failed to add patient")
    }
    const { id } = await res.json() as { id: string }
    set(state => ({ patients: [{ id, ...data }, ...state.patients] }))
    await logAudit("patient_created", "patient", id, { name: data.name })
    return id
  },

  updatePatientProfile: async (id, data) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? "Failed to update patient")
    }
    set(state => ({
      patients: state.patients.map(p => p.id === id ? { ...p, ...data } : p),
    }))
    await logAudit("patient_updated", "patient", id)
  },

  deletePatient: async (id) => {
    const res = await fetch("/api/patients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? "Failed to delete patient")
    }
    set(state => ({
      patients: state.patients.filter(p => p.id !== id),
      sessions: state.sessions.filter(s => s.patientId !== id),
    }))
    await logAudit("patient_deleted", "patient", id)
  },

  fetchAllSessions: async () => {
    const email = get().userEmail
    if (!email) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("doctor_email", email)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    set({ sessions: (data ?? []).map(row => rowToSession(row as Record<string, unknown>)) })
  },

  fetchSessions: async (patientId) => {
    const email = get().userEmail
    if (!email) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("patient_id", patientId)
      .eq("doctor_email", email)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    const mapped = (data ?? []).map(row => rowToSession(row as Record<string, unknown>))
    set(state => ({
      sessions: [
        ...state.sessions.filter(s => s.patientId !== patientId),
        ...mapped,
      ],
    }))
  },

  addSession: async (patientId) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? "Failed to create session")
    }
    const { id, createdAt } = await res.json() as { id: string; createdAt: string }
    const newSession: Session = { id, patientId, createdAt, status: "SCHEDULED" }
    set(state => ({ sessions: [newSession, ...state.sessions] }))
    return id
  },

  updateSession: async (id, data) => {
    const supabase = createClient()
    const updates: Record<string, unknown> = {}
    if (data.status        !== undefined) updates.status       = data.status
    if (data.soap          !== undefined) updates.soap         = data.soap
    if (data.transcription !== undefined) updates.transcription = data.transcription
    if (data.audioUrl      !== undefined) updates.audio_url    = data.audioUrl
    if (data.edits         !== undefined) updates.edits        = data.edits
    if (data.prescription  !== undefined) updates.prescription = data.prescription
    if (data.entities      !== undefined) updates.entities     = data.entities
    if (data.patientId     !== undefined) updates.patient_id   = data.patientId || null
    const { error } = await supabase.from("sessions").update(updates).eq("id", id)
    if (error) throw new Error(error.message)
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s),
    }))
  },

  transitionSession: async (id, status, extraData) => {
    const session = get().sessions.find(s => s.id === id)
    if (!session) throw new Error(`Session ${id} not found`)
    assertTransition(session.status, status)
    await get().updateSession(id, { ...extraData, status })
  },

  deleteSession: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from("sessions").delete().eq("id", id)
    if (error) throw new Error(error.message)
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }))
    await logAudit("session_deleted", "session", id)
  },

  getPatient:  (id) => get().patients.find(p => p.id === id),
  getSessions: (patientId) => get().sessions.filter(s => s.patientId === patientId),

  prescriptionTemplate: null,

  fetchPrescriptionTemplate: async () => {
    const email = get().userEmail
    if (!email) return
    const supabase = createClient()
    const { data } = await supabase
      .from("prescription_templates")
      .select()
      .eq("doctor_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) { set({ prescriptionTemplate: null }); return }
    const sz = data.safe_zone as Record<string, number>
    set({
      prescriptionTemplate: {
        id:          data.id,
        imagePath:   data.image_path,
        imageUrl:    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prescription-templates/${data.image_path}`,
        imageWidth:  data.image_width,
        imageHeight: data.image_height,
        safeZone: {
          xPct:         sz.x_pct,
          yPct:         sz.y_pct,
          widthPct:     sz.width_pct,
          heightPct:    sz.height_pct,
          fontSizePt:   sz.font_size_pt,
          lineHeightPt: sz.line_height_pt,
        },
      },
    })
  },

  setPrescriptionTemplate: (template) => set({ prescriptionTemplate: template }),
}))
