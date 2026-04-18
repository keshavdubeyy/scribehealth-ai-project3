"use client"

import { create } from "zustand"
import { createClient } from "@/utils/supabase/client"

export interface Patient {
  id: string
  name: string
  age: number
  gender: string
}

export interface Session {
  id: string
  patientId: string
  createdAt: string
  status: "IDLE" | "RECORDING" | "PROCESSING" | "COMPLETED"
  soap?: Record<string, string>
  transcription?: string
  audioUrl?: string
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
  deletePatient: (id: string) => Promise<void>
  fetchSessions: (patientId: string) => Promise<void>
  addSession: (patientId: string) => Promise<string>
  updateSession: (id: string, data: Partial<Session>) => Promise<void>
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
    edits:         (row.edits as Session["edits"]) ?? [],
    prescription:  row.prescription as Session["prescription"] ?? undefined,
  }
}

export const useScribeStore = create<ScribeStore>()((set, get) => ({
  userEmail: null,

  setUserEmail: (email: string) => {
    set({ userEmail: email })
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
      .select("id, name, age, gender")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    set({
      patients: (data ?? []).map(row => ({
        id:     row.id,
        name:   row.name,
        age:    row.age,
        gender: row.gender,
      })),
    })
  },

  addPatient: async (data) => {
    const email = get().userEmail
    if (!email) throw new Error("Not authenticated")
    const supabase = createClient()
    const id = Math.random().toString(36).substring(7)
    const { error } = await supabase.from("patients").insert({
      id,
      user_email: email,
      name:       data.name,
      age:        data.age,
      gender:     data.gender,
    })
    if (error) throw new Error(error.message)
    set(state => ({ patients: [{ id, ...data }, ...state.patients] }))
    return id
  },

  deletePatient: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (error) throw new Error(error.message)
    set(state => ({
      patients: state.patients.filter(p => p.id !== id),
      sessions: state.sessions.filter(s => s.patientId !== id),
    }))
  },

  fetchSessions: async (patientId) => {
    const email = get().userEmail
    if (!email) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("patient_id", patientId)
      .eq("user_email", email)
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
    const email = get().userEmail
    if (!email) throw new Error("Not authenticated")
    const supabase = createClient()
    const id = Math.random().toString(36).substring(7)
    const createdAt = new Date().toISOString()
    const { error } = await supabase.from("sessions").insert({
      id,
      patient_id: patientId,
      user_email: email,
      created_at: createdAt,
      status:     "IDLE",
      edits:      [],
    })
    if (error) throw new Error(error.message)
    const newSession: Session = {
      id,
      patientId,
      createdAt,
      status: "IDLE",
    }
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
    if (data.patientId     !== undefined) updates.patient_id   = data.patientId || null
    const { error } = await supabase.from("sessions").update(updates).eq("id", id)
    if (error) throw new Error(error.message)
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s),
    }))
  },

  deleteSession: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from("sessions").delete().eq("id", id)
    if (error) throw new Error(error.message)
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }))
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
      .eq("user_email", email)
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
