"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  soap?: {
    s: string
    o: string
    a: string
    p: string
  }
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

export interface PrescriptionTemplate {
  imageUrl: string
  safeZone: {
    x: number
    y: number
    width: number
    height: number
  }
  fontSize: number
  lineHeight: number
}

interface ScribeStore {
  patients: Patient[]
  sessions: Session[]
  
  // local crud
  fetchPatients: () => Promise<void>
  addPatient: (patient: Omit<Patient, "id">) => Promise<string>
  deletePatient: (id: string) => Promise<void>
  fetchSessions: (patientId: string) => Promise<void>
  addSession: (patientId: string) => Promise<string>
  updateSession: (id: string, data: Partial<Session>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  
  getPatient: (id: string) => Patient | undefined
  getSessions: (patientId: string) => Session[]

  // prescription template
  prescriptionTemplate: PrescriptionTemplate | null
  savePrescriptionTemplate: (template: PrescriptionTemplate) => Promise<void>
  deletePrescriptionTemplate: () => Promise<void>
}

export const useScribeStore = create<ScribeStore>()(
  persist(
    (set, get) => ({
      patients: [],
      sessions: [],

      fetchPatients: async () => {
        // No-op for local
      },

      addPatient: async (data) => {
        const id = Math.random().toString(36).substring(7)
        const newPatient = { ...data, id }
        set((state) => ({ patients: [...state.patients, newPatient] }))
        return id
      },

      deletePatient: async (id) => {
        set((state) => ({
          patients: state.patients.filter(p => p.id !== id),
          sessions: state.sessions.filter(s => s.patientId !== id)
        }))
      },

      fetchSessions: async (patientId) => {
        // No-op for local
      },

      addSession: async (patientId) => {
        const id = Math.random().toString(36).substring(7)
        const newSession: Session = {
          id,
          patientId,
          createdAt: new Date().toISOString(),
          status: "IDLE",
          soap: { s: "", o: "", a: "", p: "" }
        }
        set((state) => ({ sessions: [newSession, ...state.sessions] }))
        return id
      },

      updateSession: async (id, data) => {
        set((state) => ({
          sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s)
        }))
      },

      deleteSession: async (id) => {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id)
        }))
      },

      getPatient: (id: string) => get().patients.find(p => p.id === id),
      getSessions: (patientId: string) => get().sessions.filter(s => s.patientId === patientId),

      prescriptionTemplate: null,
      savePrescriptionTemplate: async (template: PrescriptionTemplate) => {
        set({ prescriptionTemplate: template })
      },
      deletePrescriptionTemplate: async () => {
        set({ prescriptionTemplate: null })
      },
    }),
    { name: "scribe-storage" }
  )
)
