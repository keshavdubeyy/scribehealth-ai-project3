/**
 * FR-09 + FR-12: Notification templates and system notification sender.
 *
 * Provides pre-built notification templates for lifecycle events
 * and a fire-and-forget system notification sender.
 */

export interface NotificationPayload {
  to: string
  subject: string
  body: string
}

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

/** FR-12: Send a system notification to the doctor via the server-side /api/notify endpoint. */
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
