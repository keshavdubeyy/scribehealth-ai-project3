/**
 * FR-12 + FR-09: Stakeholder notification via Strategy pattern.
 *
 * NotificationStrategy is the common interface.
 * EmailNotificationStrategy, WhatsAppNotificationStrategy, and SmsNotificationStrategy
 * are interchangeable concrete implementations — new channels (Slack, push, etc.)
 * require only a new class; the service and callers are untouched.
 *
 * NotificationService holds a registered list of strategies and fans out
 * every event to all of them in one call.
 */

export interface NotificationPayload {
  to: string        // email address or phone number depending on strategy
  subject: string
  body: string
}

// ── Strategy interface ────────────────────────────────────────────────────────

export interface NotificationStrategy {
  readonly channel: "email" | "whatsapp" | "sms"
  fire(payload: NotificationPayload): void
}

// ── Concrete strategies ───────────────────────────────────────────────────────

/** Opens the system email client pre-filled via mailto: URI. */
export class EmailNotificationStrategy implements NotificationStrategy {
  readonly channel = "email" as const

  fire({ to, subject, body }: NotificationPayload) {
    const uri = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(uri, "_blank")
  }
}

/** Opens WhatsApp Web / app pre-filled with the notification text. */
export class WhatsAppNotificationStrategy implements NotificationStrategy {
  readonly channel = "whatsapp" as const

  constructor(private readonly phone: string) {}

  fire({ subject, body }: NotificationPayload) {
    const text = `*${subject}*\n\n${body}`
    const digits = this.phone.replace(/\D/g, "")
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank")
  }
}

/** Opens the native SMS app pre-filled. */
export class SmsNotificationStrategy implements NotificationStrategy {
  readonly channel = "sms" as const

  constructor(private readonly phone: string) {}

  fire({ subject, body }: NotificationPayload) {
    const text = `${subject}\n\n${body}`
    window.open(`sms:${this.phone}?body=${encodeURIComponent(text)}`, "_blank")
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export class NotificationService {
  private readonly strategies: NotificationStrategy[] = []

  register(strategy: NotificationStrategy): this {
    this.strategies.push(strategy)
    return this
  }

  fire(payload: NotificationPayload): void {
    for (const strategy of this.strategies) {
      strategy.fire(payload)
    }
  }

  get channelCount(): number {
    return this.strategies.length
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Build a service pre-wired for the doctor's available contact channels.
 * Pass phone only if available — omitting it skips WhatsApp and SMS.
 */
export function buildDoctorNotificationService(
  email: string,
  phone?: string,
): NotificationService {
  const svc = new NotificationService()
  svc.register(new EmailNotificationStrategy())
  if (phone) {
    svc.register(new WhatsAppNotificationStrategy(phone))
    svc.register(new SmsNotificationStrategy(phone))
  }
  return svc
}

// ── Lifecycle event templates ─────────────────────────────────────────────────

type TemplateResult = Omit<NotificationPayload, "to">

export function noteReadyTemplate(patientName: string, sessionId: string): TemplateResult {
  return {
    subject: `[ScribeHealth] Note ready for review — ${patientName}`,
    body: [
      `Your AI-generated clinical note for ${patientName} is ready for review.`,
      ``,
      `Session ID: ${sessionId}`,
      ``,
      `Please log in to ScribeHealth AI to review, edit, and approve the note before it enters the permanent record.`,
      ``,
      `---`,
      `ScribeHealth AI — automated lifecycle notification`,
    ].join("\n"),
  }
}

export function noteApprovedTemplate(patientName: string, sessionId: string): TemplateResult {
  return {
    subject: `[ScribeHealth] Note approved — ${patientName}`,
    body: [
      `The clinical note for ${patientName} has been approved and locked.`,
      ``,
      `Session ID: ${sessionId}`,
      ``,
      `The note is now part of the permanent medical record and cannot be edited.`,
      ``,
      `---`,
      `ScribeHealth AI — automated lifecycle notification`,
    ].join("\n"),
  }
}

export function noteRejectedTemplate(patientName: string, sessionId: string): TemplateResult {
  return {
    subject: `[ScribeHealth] Note rejected — ${patientName}`,
    body: [
      `The AI-generated note for ${patientName} has been rejected and flagged for regeneration.`,
      ``,
      `Session ID: ${sessionId}`,
      ``,
      `Please log in to ScribeHealth AI and use the "Regenerate note" button to create a new draft.`,
      ``,
      `---`,
      `ScribeHealth AI — automated lifecycle notification`,
    ].join("\n"),
  }
}

/** FR-09: Share the approved note content directly with the patient. */
export function noteSharingTemplate(
  patientName: string,
  note: Record<string, string>,
): TemplateResult {
  const noteLines = Object.entries(note)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}\n${v}`)
    .join("\n\n")

  return {
    subject: `Your consultation notes from ScribeHealth`,
    body: [
      `Dear ${patientName},`,
      ``,
      `Please find your approved consultation notes below.`,
      ``,
      `---`,
      noteLines,
      `---`,
      ``,
      `If you have any questions, please contact your healthcare provider.`,
      ``,
      `ScribeHealth AI`,
    ].join("\n"),
  }
}

export function transcriptionFailedTemplate(patientName: string, sessionId: string): TemplateResult {
  return {
    subject: `[ScribeHealth] Transcription failed — ${patientName}`,
    body: [
      `Audio transcription failed for the session with ${patientName} after 3 retry attempts.`,
      ``,
      `Session ID: ${sessionId}`,
      ``,
      `The audio recording has been saved. Please log in to ScribeHealth AI to retry transcription from the session page.`,
      ``,
      `---`,
      `ScribeHealth AI — automated lifecycle notification`,
    ].join("\n"),
  }
}

/** FR-09: Share the generated prescription with the patient. */
export function prescriptionSharingTemplate(
  patientName: string,
  data: {
    reasonForVisit: string
    whatsWrong: string
    medicines: Array<{ name: string; dose: string; frequency: string; duration: string; timing: string }>
    nextSteps: string[]
    dateStr: string
  },
): TemplateResult {
  const medLines = data.medicines
    .filter(m => m.name)
    .map((m, i) => `${i + 1}. ${m.name} — ${m.dose}, ${m.frequency}, ${m.duration} (${m.timing})`)
    .join("\n")

  const nextLines = data.nextSteps.filter(Boolean).map(s => `• ${s}`).join("\n")

  return {
    subject: `Your prescription from ScribeHealth — ${data.dateStr}`,
    body: [
      `Dear ${patientName},`,
      ``,
      `Please find your prescription details below.`,
      ``,
      `Date: ${data.dateStr}`,
      `Reason for visit: ${data.reasonForVisit}`,
      ``,
      data.whatsWrong ? `Summary:\n${data.whatsWrong}\n` : "",
      medLines ? `Medicines:\n${medLines}\n` : "",
      nextLines ? `What to do next:\n${nextLines}\n` : "",
      `---`,
      `If you have any questions, contact your healthcare provider.`,
      ``,
      `ScribeHealth AI`,
    ].filter(l => l !== "").join("\n"),
  }
}

// ── System notification (doctor-facing, server-side) ──────────────────────────

/**
 * Send a system notification to the doctor via the server-side /api/notify
 * endpoint. This is fire-and-forget — no email client is opened.
 */
export async function sendSystemNotification(
  to: string,
  subject: string,
  body: string,
  event: string,
): Promise<void> {
  try {
    await fetch("/api/notify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ to, subject, body, event }),
    })
  } catch {
    // Silent — notification failure should never block the main workflow
  }
}
