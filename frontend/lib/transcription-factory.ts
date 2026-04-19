/**
 * Factory Method pattern for transcription providers (NFR-03 extensibility).
 *
 * TranscriptionProvider is the Product interface.
 * SarvamTranscriptionProvider is the concrete product.
 * TranscriptionServiceFactory is the Creator — new providers (Whisper, Google STT, etc.)
 * require only a new implementing class and a new case in the factory; no other code changes.
 *
 * The active provider is selected via the TRANSCRIPTION_PROVIDER env var (default: "sarvam").
 */

export interface TranscriptionProvider {
  readonly name: string
  transcribe(audioBuffer: Buffer, mimeType?: string): Promise<string>
}

// ── Concrete provider: Sarvam AI ─────────────────────────────────────────────

export class SarvamTranscriptionProvider implements TranscriptionProvider {
  readonly name = "sarvam"

  constructor(private readonly apiKey: string) {}

  async transcribe(audioBuffer: Buffer, mimeType = "audio/webm"): Promise<string> {
    const form = new FormData()
    form.append(
      "file",
      new File([audioBuffer], "recording.webm", { type: mimeType }),
    )
    form.append("model", "saarika:v2.5")

    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method:  "POST",
      headers: { "api-subscription-key": this.apiKey },
      body:    form,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Sarvam transcription failed: ${text}`)
    }

    const data = await res.json()
    return (data.transcript as string) ?? ""
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export class TranscriptionServiceFactory {
  /**
   * Return the transcription provider configured in the environment.
   * Defaults to "sarvam". Add new providers by adding cases here and
   * implementing TranscriptionProvider — no other code needs to change.
   */
  static create(
    provider = process.env.TRANSCRIPTION_PROVIDER ?? "sarvam",
  ): TranscriptionProvider {
    switch (provider) {
      case "sarvam": {
        const key = process.env.SARVAM_API_KEY
        if (!key) throw new Error("SARVAM_API_KEY not configured")
        return new SarvamTranscriptionProvider(key)
      }
      default:
        throw new Error(`Unknown transcription provider: "${provider}"`)
    }
  }
}
