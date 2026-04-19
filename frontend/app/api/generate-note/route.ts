import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import { NoteGeneratorFactory } from "@/lib/soap-note-generator"

export const runtime = "nodejs"
export const maxDuration = 60

function extractJson(text: string): Record<string, string> {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try { return JSON.parse(match[0]) as Record<string, string> } catch { return {} }
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
  // Uses NoteGeneratorFactory.templateNames() so the detection prompt stays
  // in sync with the registered generators automatically.
  let templateName = "general_opd"
  let patientName: string | null = null
  let patientAge: number | null = null

  try {
    const detection = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Analyze this medical consultation transcript and return JSON only (no other text):
${transcript.slice(0, 2000)}

Respond with exactly:
{"template":"${NoteGeneratorFactory.templateNames().join("|")}","patient_name":"string or null","patient_age":number or null}`,
      }],
    })
    const raw    = detection.content[0].type === "text" ? detection.content[0].text : ""
    const parsed = extractJson(raw)
    if (parsed.template && NoteGeneratorFactory.templateNames().includes(parsed.template)) {
      templateName = parsed.template
    }
    patientName = (parsed.patient_name as string) || null
    patientAge  = typeof parsed.patient_age === "number" ? parsed.patient_age : null
  } catch { /* use defaults */ }

  // Step 2 — Note generation via the Template Method hierarchy
  const generator = NoteGeneratorFactory.get(templateName)
  const note      = await generator.generate(transcript, client)

  return NextResponse.json({ note, template: templateName, patientName, patientAge })
}
