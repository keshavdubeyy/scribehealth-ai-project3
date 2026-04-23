import { logAudit } from "@/lib/audit"
import {
  sendSystemNotification,
  noteApprovedTemplate,
  noteRejectedTemplate,
  transcriptionFailedTemplate,
} from "@/lib/notifications"

export type ConsultationEvent =
  | "session_created"
  | "in_progress"
  | "recorded"
  | "transcribed"
  | "note_ready"
  | "note_approved"
  | "note_rejected"
  | "transcription_failed"

export interface ConsultationEventPayload {
  sessionId: string
  userEmail?: string
  patientName?: string
  patientId?: string
}

export interface ConsultationObserver {
  onEvent(event: ConsultationEvent, payload: ConsultationEventPayload): void
}

export class ConsultationSubject {
  private observers: ConsultationObserver[] = []

  subscribe(observer: ConsultationObserver): void {
    this.observers.push(observer)
  }

  unsubscribe(observer: ConsultationObserver): void {
    this.observers = this.observers.filter(o => o !== observer)
  }

  notify(event: ConsultationEvent, payload: ConsultationEventPayload): void {
    for (const observer of this.observers) {
      observer.onEvent(event, payload)
    }
  }
}

export class DoctorNotifierObserver implements ConsultationObserver {
  constructor(private readonly userEmail: string) {}

  onEvent(event: ConsultationEvent, payload: ConsultationEventPayload): void {
    const { sessionId, patientName = "Unknown" } = payload

    if (event === "note_approved") {
      const { subject, body } = noteApprovedTemplate(patientName, sessionId)
      void sendSystemNotification(this.userEmail, subject, body, `note_approved:${sessionId}`)
    }

    if (event === "note_rejected") {
      const { subject, body } = noteRejectedTemplate(patientName, sessionId)
      void sendSystemNotification(this.userEmail, subject, body, `note_rejected:${sessionId}`)
    }

    if (event === "transcription_failed") {
      const { subject, body } = transcriptionFailedTemplate(patientName, sessionId)
      void sendSystemNotification(this.userEmail, subject, body, `transcription_failed:${sessionId}`)
    }
  }
}

export class AuditLoggerObserver implements ConsultationObserver {
  onEvent(event: ConsultationEvent, payload: ConsultationEventPayload): void {
    const { sessionId, patientId } = payload

    const auditActionMap: Partial<Record<ConsultationEvent, string>> = {
      session_created:      "session_created",
      note_approved:        "note_approved",
      note_rejected:        "note_rejected",
      transcription_failed: "transcription_failed",
    }

    const action = auditActionMap[event]
    if (!action) return

    const metadata = patientId ? { patientId } : undefined
    void logAudit(action, "session", sessionId, metadata)
  }
}

export class DashboardRefresherObserver implements ConsultationObserver {
  constructor(private readonly refresh: () => void) {}

  onEvent(event: ConsultationEvent): void {
    if (event === "note_approved" || event === "note_rejected") {
      this.refresh()
    }
  }
}

export const consultationSubject = new ConsultationSubject()
