/**
 * Template Method pattern for clinical SOAP note generation (NFR-03 extensibility).
 *
 * SoapNoteGenerator is the abstract class that defines the fixed algorithm:
 *   1. Build a specialty-aware prompt  (invariant — done by base class)
 *   2. Call Claude Sonnet              (invariant — done by base class)
 *   3. Parse and normalise fields      (invariant — done by base class)
 *
 * Subclasses override only `templateName`, `fields`, and the optional
 * `specialtyContext()` hook.  Adding a new specialty requires only a new
 * subclass and one line in NoteGeneratorFactory — the API route is untouched.
 */

import Anthropic from "@anthropic-ai/sdk"

// ── Shared helper ─────────────────────────────────────────────────────────────

function extractJson(text: string): Record<string, string> {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try { return JSON.parse(match[0]) as Record<string, string> } catch { return {} }
}

// ── Abstract base ─────────────────────────────────────────────────────────────

export abstract class SoapNoteGenerator {
  abstract readonly templateName: string
  abstract readonly fields: readonly string[]

  /**
   * Template method — fixed skeleton; subclasses customise via overrides.
   * Returns a record with every field key present (empty string if not found).
   */
  async generate(
    transcript: string,
    client: Anthropic,
  ): Promise<Record<string, string>> {
    const raw = await this.callModel(transcript, client)
    return this.normaliseFields(raw)
  }

  /** Hook — subclasses may override to inject specialty context into the prompt. */
  protected specialtyContext(): string {
    return ""
  }

  private async callModel(
    transcript: string,
    client: Anthropic,
  ): Promise<Record<string, string>> {
    const ctx = this.specialtyContext()
    const res = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          `You are a medical scribe${ctx ? ` specialising in ${ctx}` : ""}.`,
          `Generate a structured clinical note from this consultation transcript.`,
          ``,
          `TRANSCRIPT:`,
          transcript,
          ``,
          `Return a JSON object with EXACTLY these keys: ${this.fields.join(", ")}`,
          `Fill each key with concise, clinical prose from the transcript.`,
          `Leave a key as "" if the content is not mentioned.`,
          `Respond with JSON only — no markdown, no explanation.`,
        ].join("\n"),
      }],
    })

    const text = res.content[0].type === "text" ? res.content[0].text : "{}"
    return extractJson(text)
  }

  private normaliseFields(raw: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const f of this.fields) result[f] = raw[f] ?? ""
    return result
  }
}

// ── Concrete generators ───────────────────────────────────────────────────────

export class GeneralOpdNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "general_opd"
  readonly fields = ["subjective", "objective", "assessment", "diagnosis", "prescription", "advice", "follow_up"] as const
}

export class MentalHealthNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "mental_health_soap"
  readonly fields = ["subjective", "objective", "assessment", "plan", "safety_assessment"] as const
  protected specialtyContext() { return "mental health and psychiatry" }
}

export class PhysiotherapyNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "physiotherapy"
  readonly fields = ["subjective", "objective", "assessment", "treatment", "home_exercise_program", "plan"] as const
  protected specialtyContext() { return "physiotherapy and rehabilitation" }
}

export class PediatricNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "pediatric"
  readonly fields = ["subjective", "objective", "assessment", "plan", "parent_instructions", "follow_up"] as const
  protected specialtyContext() { return "paediatrics" }
}

export class CardiologyNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "cardiology"
  readonly fields = ["subjective", "objective", "assessment", "plan", "medications", "follow_up"] as const
  protected specialtyContext() { return "cardiology and cardiovascular medicine" }
}

export class SurgicalFollowupNoteGenerator extends SoapNoteGenerator {
  readonly templateName = "surgical_followup"
  readonly fields = ["wound_assessment", "subjective", "objective", "assessment", "plan", "next_review"] as const
  protected specialtyContext() { return "post-operative surgical follow-up" }
}

// ── Factory ───────────────────────────────────────────────────────────────────

const GENERATORS: SoapNoteGenerator[] = [
  new GeneralOpdNoteGenerator(),
  new MentalHealthNoteGenerator(),
  new PhysiotherapyNoteGenerator(),
  new PediatricNoteGenerator(),
  new CardiologyNoteGenerator(),
  new SurgicalFollowupNoteGenerator(),
]

export class NoteGeneratorFactory {
  /** Return the generator for the given template name, defaulting to General OPD. */
  static get(templateName: string): SoapNoteGenerator {
    return GENERATORS.find(g => g.templateName === templateName)
      ?? new GeneralOpdNoteGenerator()
  }

  /** All registered template names — used for template-detection prompts. */
  static templateNames(): string[] {
    return GENERATORS.map(g => g.templateName)
  }
}
