import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 30

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T } catch { return null }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })

  const { transcript, soap } = await req.json() as {
    transcript?: string
    soap?: Record<string, string>
  }

  const context = [
    transcript ? `TRANSCRIPT:\n${transcript}` : "",
    soap ? `CLINICAL NOTE:\n${JSON.stringify(soap, null, 2)}` : "",
  ].filter(Boolean).join("\n\n")

  if (!context.trim()) return NextResponse.json({ error: "No input provided" }, { status: 400 })

  const client = new Anthropic({ apiKey })

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are a medical assistant helping a doctor write a patient-facing prescription.

${context}

Extract the following from this consultation and return JSON only (no markdown, no explanation):
{
  "whatsWrong": "1-2 sentence plain-language explanation written for the patient (not the doctor)",
  "medicines": [
    {
      "name": "full medicine name with strength (e.g. Tab Paracetamol 500mg)",
      "dose": "e.g. 1 tablet",
      "frequency": "Once daily | Twice daily | 3 times daily | 4 times daily | Every 8 hours | Every 12 hours | At bedtime | As needed (SOS)",
      "duration": "e.g. 5 days",
      "timing": "After food | Before food | With food | Empty stomach | At bedtime | Any time"
    }
  ],
  "nextSteps": ["plain language instruction 1", "instruction 2"]
}

If no medicines are mentioned, return an empty array. If no next steps, return an empty array. Always return valid JSON.`,
    }],
  })

  const raw = res.content[0].type === "text" ? res.content[0].text : "{}"
  type ParseResult = {
    whatsWrong: string
    medicines: Array<{ name: string; dose: string; frequency: string; duration: string; timing: string }>
    nextSteps: string[]
  }
  const parsed = extractJson<ParseResult>(raw)

  return NextResponse.json({
    whatsWrong: parsed?.whatsWrong ?? "",
    medicines:  (parsed?.medicines ?? []).map((m, i) => ({ ...m, id: `m_${Date.now()}_${i}` })),
    nextSteps:  parsed?.nextSteps ?? [],
  })
}
