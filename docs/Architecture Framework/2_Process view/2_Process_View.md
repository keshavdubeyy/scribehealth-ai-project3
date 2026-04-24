# Process View — State Machine & Audio Pipeline Async Flow

> **4+1 View: Process** — Shows runtime behaviour: the consultation lifecycle state machine and the asynchronous audio processing sequence.

---

## State Machine — Consultation Lifecycle (FR-11)

**What this shows:** The 7 legal states of a `ClinicalSession` and every permitted transition. This is directly implemented in two places: `ConsultationStateFactory` + concrete state classes on the Java backend (`lifecycle/state/`), and `VALID_TRANSITIONS` + `assertTransition()` in `lib/session-state-machine.ts` on the frontend. Both enforce the same rules independently — the backend is the source of truth, the frontend provides immediate UI feedback.

**Key constraints encoded in this diagram:**
- `APPROVED` is the only terminal state. Once a note is approved, `ApprovedState.transitionTo()` always throws `IllegalStateTransitionException`. There is no revert, no delete.
- `REJECTED → UNDER_REVIEW` is the only regeneration path. A rejected note cannot be directly approved — it must be regenerated, producing a new SOAP note, before the doctor can approve.
- The pipeline states `RECORDED → TRANSCRIBED → UNDER_REVIEW` are driven entirely by the AI pipeline (not by the doctor). Only `SCHEDULED → IN_PROGRESS → RECORDED` and `UNDER_REVIEW → APPROVED/REJECTED` are triggered by explicit doctor actions.
- Every transition fires a `ConsultationEvent` through the `ConsultationEventPublisher`, triggering all three registered observers.

```plantuml
@startuml Process_StateMachine
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam stateBorderColor #555
skinparam stateBackgroundColor #FFFFFF
skinparam arrowColor #444
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Consultation Lifecycle State Machine (FR-11)

[*] --> SCHEDULED : Doctor creates session\n<<SessionService.createSession()>>

SCHEDULED --> IN_PROGRESS : Doctor starts recording\n<<assertTransition + DB update>>

IN_PROGRESS --> RECORDED : Doctor stops recording\n<<audio saved to Supabase Storage>>

RECORDED --> TRANSCRIBED : Sarvam AI transcription complete\n<<withRetry() × 3 on failure>>

TRANSCRIBED --> UNDER_REVIEW : SOAP note generated\n<<Claude Sonnet + NoteGeneratorFactory>>

UNDER_REVIEW --> APPROVED : Doctor approves\n<<note locked — immutable>>

UNDER_REVIEW --> REJECTED : Doctor rejects\n<<flagged for regeneration>>

REJECTED --> UNDER_REVIEW : Doctor regenerates note\n<<new SOAP generated — back to review>>

APPROVED --> [*] : Terminal state\n<<no further transitions allowed>>

note right of SCHEDULED
  Default status on session creation.
  assertTransition() blocks any skip.
end note

note right of IN_PROGRESS
  Recording active.
  Frontend timer starts.
end note

note right of RECORDED
  Audio URL persisted.
  Triggers async AI pipeline.
end note

note right of TRANSCRIBED
  Transcript ready.
  Entity extraction runs next.
end note

note right of UNDER_REVIEW
  SOAP note ready for doctor.
  Human-in-the-loop checkpoint (NFR-01).
end note

note right of APPROVED
  Immutable record.
  Available for sharing (FR-09).
  Audit: note_approved.
end note

note right of REJECTED
  Only valid next state: UNDER_REVIEW.
  Regeneration path active.
  Audit: note_rejected.
end note

@enduml
```

---

## Communication Flow — Audio Pipeline (Async Sequence, FR-04 / NFR-02 / NFR-05)

**What this shows:** The runtime message flow across 10 participants for a single consultation, from the doctor clicking "Stop Recording" to the SOAP note appearing in UNDER_REVIEW. This is the most latency-sensitive path in the system and the one most directly shaped by NFR-02 (non-blocking) and NFR-05 (reliability).

**Key architectural decisions visible here:**
- **MediaRecorder → Supabase Storage** (Step 1): The audio blob is uploaded directly to Supabase Storage from the browser via the `/api/transcribe` route. The `audioUrl` is persisted to `sessions` immediately, ensuring the recording is never lost even if the pipeline fails mid-way.
- **`TranscriptionServiceFactory.create()`** (Step 2): The factory reads the `TRANSCRIPTION_PROVIDER` environment variable and returns a `SarvamTranscriptionProvider`. Swapping to Whisper or Google STT requires only a new class implementing `TranscriptionProvider` and a one-character env var change — no other code changes (NFR-03).
- **`withRetry()` group** (Step 2): Wraps the Sarvam API call with 3 attempts and linear backoff (1s → 2s). On final failure, the session status is left at `RECORDED` — the audio is preserved and the doctor can manually retry. The status is never advanced past `RECORDED` on failure, satisfying NFR-05.
- **Claude Haiku vs. Claude Sonnet** (Steps 3 & 4): Two different Claude models are used for different tasks. Haiku is faster and cheaper for structured JSON extraction (entity categories). Sonnet produces higher-quality prose for the specialty-aware SOAP note sections.
- **`NoteGeneratorFactory.get(template)`** (Step 4): Selects the correct `SoapNoteGenerator` subclass (e.g., `CardiologyNoteGenerator`) based on the template name. The `generate()` method is a Template Method — the abstract base class calls `callModel()` and `normaliseFields()` invariantly; subclasses override only `specialtyContext()` and `fields`.

```plantuml
@startuml Process_AsyncPipeline
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceLifeLineBorderColor #888
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam sequenceParticipantBorderColor #555
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
skinparam sequenceGroupBorderColor #999
skinparam sequenceGroupBackgroundColor #F9F9F9

title ScribeHealth AI — Audio Pipeline Communication Flow\n(Async, Non-Blocking — NFR-02)

actor       "Doctor"               as D
participant "Browser\n(MediaRecorder)"  as BR
participant "Next.js\n/api/transcribe"  as TS
participant "TranscriptionFactory"      as TF
participant "SarvamProvider"           as SAR
participant "Next.js\n/api/extract-entities" as EE
participant "Next.js\n/api/generate-note"    as GN
participant "Claude\n(Haiku)"              as CH
participant "Claude\n(Sonnet)"             as CS
participant "Supabase"                  as DB
participant "ConsultationEventPublisher" as PUB

== Step 1: Recording ==
D -> BR : click Start Recording
BR -> BR : MediaRecorder.start()
note right : Non-blocking — UI remains\nresponsive during capture
D -> BR : click Stop Recording
BR -> TS : POST audio blob (FormData)
TS -> DB : upload audio → Supabase Storage
DB --> TS : audioUrl
TS -> DB : UPDATE sessions{status=RECORDED, audioUrl}

== Step 2: Transcription (FR-04 / NFR-05 — Retry) ==
TS -> TF : TranscriptionServiceFactory.create()
note right : Factory Method resolves\nprovider from TRANSCRIPTION_PROVIDER env
TF --> TS : SarvamTranscriptionProvider

group withRetry (max 3 attempts, 1s → 2s backoff)
  TS -> SAR : POST /speech-to-text (audioBuffer, mimeType)
  activate SAR
  alt Success
    SAR --> TS : { transcript: String }
    deactivate SAR
    TS -> DB : UPDATE sessions{status=TRANSCRIBED, transcription}
    TS -> PUB : publish(ConsultationEvent{RECORDED → TRANSCRIBED})
  else Failure (attempt < 3)
    SAR --> TS : HTTP error
    note right : wait 1s then retry
    TS -> SAR : retry request
  else All 3 attempts failed
    SAR --> TS : final error
    TS -> DB : UPDATE sessions{status=RECORDED}\n(preserved — no data loss NFR-05)
    TS -> DB : <<audit>> transcription_failed
  end
end

== Step 3: Entity Extraction (FR-05) ==
TS -> EE : POST /api/extract-entities {transcript}
EE -> CH : Claude Haiku prompt\n(extract symptoms, diagnoses,\nmedications, allergies, vitals)
activate CH
CH --> EE : MedicalEntities JSON
deactivate CH
EE -> DB : UPDATE sessions{entities}

== Step 4: SOAP Note Generation (FR-06 / NFR-03 — Template Method) ==
TS -> GN : POST /api/generate-note {transcript, template}
GN -> GN : NoteGeneratorFactory.get(template)
note right : Selects specialty generator\n(Template Method pattern — NFR-03)
GN -> CS : Claude Sonnet prompt\n(specialty-aware fields)
activate CS
CS --> GN : SoapNote JSON
deactivate CS
GN -> DB : UPDATE sessions{status=UNDER_REVIEW, soap}
GN -> PUB : publish(ConsultationEvent{TRANSCRIBED → UNDER_REVIEW})

== Step 5: Observer Notifications (FR-12) ==
PUB -> PUB : AuditLoggerObserver\n→ audit: note_ready
PUB -> PUB : DoctorNotifierObserver\n→ log INFO
PUB -> PUB : SessionStatusObserver\n→ log transition

note over D, DB
  The entire pipeline from Stop Recording to UNDER_REVIEW
  runs server-side and asynchronously. The doctor's UI
  polls or subscribes (Supabase Realtime) for status updates
  without blocking on any AI call (NFR-02).
end note

@enduml
```
