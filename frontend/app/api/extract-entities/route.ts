import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import type { MedicalEntities } from "@/lib/mock-store"

export const runtime = "nodejs"
export const maxDuration = 30

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T } catch { return null }
}

const EMPTY: MedicalEntities = {
  symptoms:       [],
  diagnoses:      [],
  medications:    [],
  allergies:      [],
  vitals:         [],
  treatmentPlans: [],
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })

  const { transcript } = await req.json() as { transcript: string }
  if (!transcript?.trim()) return NextResponse.json({ entities: EMPTY })

  const client = new Anthropic({ apiKey })

  const res = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are a medical NLP system. Extract structured clinical entities from the consultation transcript below.

TRANSCRIPT:
${transcript.slice(0, 6000)}

Return a JSON object with EXACTLY these keys. Use empty arrays if nothing is mentioned.

{
  "symptoms": ["plain description of each symptom mentioned"],
  "diagnoses": ["each diagnosis or suspected condition"],
  "medications": [
    { "name": "drug name and strength", "dosage": "e.g. 1 tablet", "frequency": "e.g. twice daily" }
  ],
  "allergies": [
    { "substance": "allergen name", "severity": "mild | moderate | severe | unknown" }
  ],
  "vitals": [
    { "metric": "e.g. Blood Pressure", "value": "e.g. 120/80", "unit": "e.g. mmHg" }
  ],
  "treatmentPlans": ["each treatment plan item, advice, or follow-up instruction"]
}

Return only valid JSON. No markdown, no explanation.`,
    }],
  })

  const raw    = res.content[0].type === "text" ? res.content[0].text : "{}"
  const parsed = extractJson<MedicalEntities>(raw)

  const entities: MedicalEntities = {
    symptoms:       parsed?.symptoms       ?? [],
    diagnoses:      parsed?.diagnoses      ?? [],
    medications:    parsed?.medications    ?? [],
    allergies:      parsed?.allergies      ?? [],
    vitals:         parsed?.vitals         ?? [],
    treatmentPlans: parsed?.treatmentPlans ?? [],
  }

  return NextResponse.json({ entities })
}
