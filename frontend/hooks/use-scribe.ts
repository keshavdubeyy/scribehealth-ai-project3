"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export type SessionStatus = "IDLE" | "RECORDING" | "PROCESSING" | "COMPLETED"

export interface Patient {
    id: string
    name: string
    age: number
    gender: string
    contactInfo?: string
}

export interface ConsultationSession {
    id: string
    patientId: string
    status: SessionStatus
    createdAt: string
}

export function useScribe() {
    const { data: authSession } = useSession()
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8081/api"
    const token = authSession?.user?.accessToken

    const [patients, setPatients] = useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [sessions, setSessions] = useState<ConsultationSession[]>([])
    const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null)
    const [transcription, setTranscription] = useState<any>(null)
    const [note, setNote] = useState<any>(null)
    const [prescriptions, setPrescriptions] = useState<any[]>([])

    // Fetch Patients
    const fetchPatients = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`${apiBase}/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setPatients(data)
                // Auto-select first patient for MVP if none selected
                if (data.length > 0 && !selectedPatient) {
                    setSelectedPatient(data[0])
                }
            }
        } catch (e) {
            console.error("Fetch patients failed:", e)
        }
    }, [apiBase, token, selectedPatient])

    // Delete Patient
    const deletePatient = async (id: string) => {
        if (!token) return
        try {
            const res = await fetch(`${apiBase}/patients/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                await fetchPatients()
                if (selectedPatient?.id === id) setSelectedPatient(null)
            }
        } catch (e) {
            console.error("Delete patient failed:", e)
        }
    }

    // Fetch Sessions for Patient
    useEffect(() => {
        if (!selectedPatient || !token) {
            setSessions([])
            return
        }
        
        const fetchSessions = async () => {
            try {
                const res = await fetch(`${apiBase}/sessions/patient/${selectedPatient.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setSessions(data)
                }
            } catch (e) {
                console.error("Fetch sessions failed:", e)
            }
        }
        fetchSessions()
    }, [selectedPatient, apiBase, token])

    // Start New Session
    const startSession = async (patientId: string) => {
        if (!token) return
        try {
            const res = await fetch(`${apiBase}/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ patientId, status: "IDLE" })
            })
            if (res.ok) {
                const newSession = await res.json()
                setSessions(prev => [newSession, ...prev])
                setActiveSession(newSession)
            }
        } catch (e) {
            console.error("Start session failed:", e)
        }
    }

    const selectSession = async (session: ConsultationSession) => {
        setActiveSession(session)
        // Trigger fetch for transcription, notes, etc. associated with this session
        if (!token) return
        
        try {
            // Fetch Transcription
            const tRes = await fetch(`${apiBase}/transcriptions/session/${session.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (tRes.ok) setTranscription(await tRes.json())
            else setTranscription(null)

            // Fetch Note
            const nRes = await fetch(`${apiBase}/notes/session/${session.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (nRes.ok) setNote(await nRes.json())
            else setNote(null)

        } catch (e) {
            console.error("Select session extra data fetch failed:", e)
        }
    }

    // Initial Patient Fetch
    useEffect(() => {
        if (token) fetchPatients()
    }, [token, fetchPatients])

    return {
        patients,
        selectedPatient,
        setSelectedPatient,
        sessions,
        activeSession,
        startSession,
        selectSession,
        transcription,
        note,
        prescriptions,
        fetchPatients,
        deletePatient,
        apiBase,
        token
    }
}
