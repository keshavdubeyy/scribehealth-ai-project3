"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getSession } from "next-auth/react"

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
  savePrescriptionTemplate: (template: PrescriptionTemplate) => Promise<void>
  deletePrescriptionTemplate: () => Promise<void>
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8081/api"

async function getAuthToken(): Promise<string> {
  const session = await getSession()
  return (session?.user as { accessToken?: string })?.accessToken ?? ""
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export const useScribeStore = create<ScribeStore>()(
  persist(
    (set, get) => ({
      patients: [],
      sessions: [],

      fetchPatients: async () => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/patients`, { headers })
        if (!res.ok) return
        const data: Patient[] = await res.json()
        set({ patients: data })
      },

      addPatient: async (data) => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/patients`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to create patient")
        const created: Patient = await res.json()
        set((state) => ({ patients: [...state.patients, created] }))
        return created.id
      },

      deletePatient: async (id) => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/patients/${id}`, {
          method: "DELETE",
          headers,
        })
        if (!res.ok) throw new Error("Failed to delete patient")
        set((state) => ({
          patients: state.patients.filter((p) => p.id !== id),
          sessions: state.sessions.filter((s) => s.patientId !== id),
        }))
      },

      fetchSessions: async (patientId) => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/sessions/patient/${patientId}`, { headers })
        if (!res.ok) return
        const data: Session[] = await res.json()
        set((state) => ({
          sessions: [
            ...state.sessions.filter((s) => s.patientId !== patientId),
            ...data,
          ],
        }))
      },

      addSession: async (patientId) => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/sessions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            patientId,
            status: "IDLE",
            soap: { s: "", o: "", a: "", p: "" },
          }),
        })
        if (!res.ok) throw new Error("Failed to create session")
        const created: Session = await res.json()
        set((state) => ({ sessions: [created, ...state.sessions] }))
        return created.id
      },

      updateSession: async (id, data) => {
        const state = get()
        const existing = state.sessions.find((s) => s.id === id)
        const merged = { ...existing, ...data }
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/sessions/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(merged),
        })
        if (!res.ok) throw new Error("Failed to update session")
        const updated: Session = await res.json()
        set((s) => ({
          sessions: s.sessions.map((s) => (s.id === id ? updated : s)),
        }))
      },

      deleteSession: async (id) => {
        const headers = await authHeaders()
        const res = await fetch(`${apiBase}/sessions/${id}`, {
          method: "DELETE",
          headers,
        })
        if (!res.ok) throw new Error("Failed to delete session")
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }))
      },

      getPatient: (id: string) => get().patients.find((p) => p.id === id),
      getSessions: (patientId: string) =>
        get().sessions.filter((s) => s.patientId === patientId),

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
