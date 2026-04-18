import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const NOTE_FIELDS: Record<string, string[]> = {
  general_opd:        ["subjective", "objective", "assessment", "diagnosis", "prescription", "advice", "follow_up"],
  mental_health_soap: ["subjective", "objective", "assessment", "plan", "safety_assessment"],
  physiotherapy:      ["subjective", "objective", "assessment", "treatment", "home_exercise_program", "plan"],
  pediatric:          ["subjective", "objective", "assessment", "plan", "parent_instructions", "follow_up"],
  cardiology:         ["subjective", "objective", "assessment", "plan", "medications", "follow_up"],
  surgical_followup:  ["wound_assessment", "subjective", "objective", "assessment", "plan", "next_review"],
}

function extractJson(text: string): Record<string, string> {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try { return JSON.parse(match[0]) } catch { return {} }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })

  const { transcript } = await req.json() as { transcript: string }
  if (!transcript?.trim()) return NextResponse.json({ error: "No transcript provided" }, { status: 400 })

  const client = new Anthropic({ apiKey })

  // Step 1 — Template detection + metadata extraction (Haiku, fast)
  let template = "general_opd"
  let patientName: string | null = null
  let patientAge: number | null = null

  try {
    const detection = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Analyze this medical consultation transcript and return JSON only (no other text):
${transcript.slice(0, 2000)}

Respond with exactly:
{"template":"general_opd|mental_health_soap|physiotherapy|pediatric|cardiology|surgical_followup","patient_name":"string or null","patient_age":number or null}`,
      }],
    })
    const raw = detection.content[0].type === "text" ? detection.content[0].text : ""
    const parsed = extractJson(raw)
    if (parsed.template && NOTE_FIELDS[parsed.template as string]) template = parsed.template as string
    patientName = (parsed.patient_name as string) || null
    patientAge = typeof parsed.patient_age === "number" ? parsed.patient_age : null
  } catch { /* use defaults */ }

  // Step 2 — Note generation (Sonnet)
  const fields = NOTE_FIELDS[template]

  const noteRes = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a medical scribe. Generate a structured clinical note from this consultation transcript.

TRANSCRIPT:
${transcript}

Return a JSON object with EXACTLY these keys: ${fields.join(", ")}
Fill each key with concise, clinical prose from the transcript. Leave a key as "" if not mentioned.
Respond with JSON only — no markdown, no explanation.`,
    }],
  })

  const noteText = noteRes.content[0].type === "text" ? noteRes.content[0].text : "{}"
  const note: Record<string, string> = extractJson(noteText)
  // Ensure all fields present
  for (const f of fields) { if (!note[f]) note[f] = "" }

  return NextResponse.json({ note, template, patientName, patientAge })
}
