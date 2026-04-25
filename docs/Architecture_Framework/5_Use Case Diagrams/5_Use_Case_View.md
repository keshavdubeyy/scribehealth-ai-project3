# Use Case View — Doctor, Admin & System Actors

> **4+1 View: Use Case (Scenarios)** — Illustrates key system scenarios from the user perspective and traces architecturally significant paths through the system.

---

## Use Case Diagram — All Actors

**What this shows:** All 21 use cases grouped by actor (Doctor, Admin, System, Patient). The System actor represents the automated AI pipeline — it has its own use cases (`UC-08` transcription, `UC-09` entity extraction, `UC-10` SOAP generation) because these run asynchronously without any doctor interaction.

**Key actor and relationship decisions:**
- **Doctor** initiates all consultation use cases (UC-05 through UC-15) but does not interact with the AI pipeline directly. The doctor triggers UC-06 (Record Audio) which `<<triggers>>` UC-08 through UC-10 automatically.
- **Admin** has a completely separate use-case surface (UC-16 to UC-18). The only overlap with Doctor is UC-01 (Login), reflecting that both roles authenticate through the same NextAuth flow but land in different dashboards.
- **Patient** is a passive actor — they only appear as a recipient of UC-15 (Share Note/Prescription). The patient never logs in to the system; they receive content via Email, WhatsApp, or SMS.
- **`UC-19` (Audit Logging)** is not directly invoked by any actor — it is `<<include>>`d by UC-12 and UC-13 and implicitly triggered by every state change. The note at the bottom of the diagram captures this: every UC-01 to UC-18 writes to `audit_logs`.
- **`UC-21` (Retry Transcription)** `<<extend>>`s UC-08 — it activates only on failure, not on the happy path. This correctly models `withRetry()` as an extension, not an inclusion.

```plantuml
@startuml UseCase_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam usecaseBorderColor #555
skinparam usecaseBackgroundColor #FFFFFF
skinparam actorBorderColor #333
skinparam arrowColor #444
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Use Case Diagram

left to right direction

actor "Doctor"           as DR  #LightSteelBlue
actor "Administrator"    as AD  #LightSalmon
actor "System\n(AI Pipeline)"  as SYS #LightYellow
actor "Patient"          as PAT #PaleGreen

rectangle "ScribeHealth AI" {

  ' ── Auth ──────────────────────────────────────────────
  usecase "UC-01\nLogin / Logout"                       as UC01
  usecase "UC-02\nView & Edit Profile\n(specialization, license)" as UC02

  ' ── Patient Management ────────────────────────────────
  usecase "UC-03\nManage Patients\n(add / edit / delete)"    as UC03
  usecase "UC-04\nView Patient History\n& Medical Records"   as UC04

  ' ── Consultation Lifecycle ────────────────────────────
  usecase "UC-05\nSchedule Session"                     as UC05
  usecase "UC-06\nRecord Audio\n(start / pause / stop)" as UC06
  usecase "UC-07\nSelect Note Template\n(specialty)"    as UC07

  ' ── AI Pipeline ───────────────────────────────────────
  usecase "UC-08\nTranscribe Audio\n(async, with retry)" as UC08
  usecase "UC-09\nExtract Medical Entities\n(symptoms, diagnoses…)" as UC09
  usecase "UC-10\nGenerate SOAP Note\n(specialty-aware)"     as UC10

  ' ── Review ────────────────────────────────────────────
  usecase "UC-11\nReview & Edit SOAP Note" as UC11
  usecase "UC-12\nApprove Note\n(locks permanently)"    as UC12
  usecase "UC-13\nReject & Regenerate Note"             as UC13

  ' ── Sharing ───────────────────────────────────────────
  usecase "UC-14\nGenerate Prescription"                as UC14
  usecase "UC-15\nShare Note / Prescription\n(Email / WhatsApp / SMS)" as UC15

  ' ── Admin ─────────────────────────────────────────────
  usecase "UC-16\nManage Users\n(create / activate / deactivate)" as UC16
  usecase "UC-17\nView Audit Log\n(all system actions)"      as UC17
  usecase "UC-18\nView System Statistics"                    as UC18

  ' ── System (automated) ───────────────────────────────
  usecase "UC-19\nLog Every Action\n(immutable audit_logs)"  as UC19
  usecase "UC-20\nSend Lifecycle Notifications\n(note_ready, approved, failed)" as UC20
  usecase "UC-21\nRetry Transcription\n(withRetry × 3)"      as UC21
}

' Doctor associations
DR --> UC01
DR --> UC02
DR --> UC03
DR --> UC04
DR --> UC05
DR --> UC06
DR --> UC07
DR --> UC11
DR --> UC12
DR --> UC13
DR --> UC14
DR --> UC15

' Admin associations
AD --> UC01
AD --> UC16
AD --> UC17
AD --> UC18

' System (automated pipeline) associations
SYS --> UC08
SYS --> UC09
SYS --> UC10
SYS --> UC19
SYS --> UC20
SYS --> UC21

' Patient (passive — recipient)
UC15 --> PAT : receives note/prescription

' <<include>> relationships
UC06 ..> UC08 : <<triggers>>
UC08 ..> UC09 : <<triggers>>
UC09 ..> UC10 : <<triggers>>
UC10 ..> UC11 : <<enables>>
UC12 ..> UC19 : <<include>>
UC13 ..> UC19 : <<include>>
UC08 ..> UC21 : <<extend>>\non failure
UC12 ..> UC20 : <<include>>

note "Every action (UC-01 to UC-18)\nautomatically includes UC-19\n(audit logging — NFR-04)" as N1

@enduml
```

---

## Scenario 1 — End-to-End: Record → Transcribe → SOAP → Approve

**What this shows:** The happy-path sequence for a complete consultation, from login through to note sharing. This scenario traces the full 7-state lifecycle in a single continuous flow, showing exactly which component handles each step and what is written to the database at each point.

**Architectural decisions highlighted in this scenario:**
- **Login writes an audit entry immediately**: `logAuditServer()` is called inside the NextAuth `signIn` event, not from any API route. This means the audit is captured at the identity layer — before the doctor even reaches the dashboard.
- **`assertTransition()` is called client-side before every `UPDATE`**: The frontend never blindly writes a new status. It calls `assertTransition(currentStatus, newStatus)` from `session-state-machine.ts` first, throwing an error if the transition is illegal. The backend state machine then validates again.
- **Observer pipeline fires at `UNDER_REVIEW`**: The `ConsultationEventPublisher` is invoked immediately after the SOAP note is persisted. The `AuditLoggerObserver` writes `note_ready` to `audit_logs`; `DoctorNotifierObserver` logs INFO. These are fire-and-forget — they do not block the API response.
- **Approval locks the note permanently**: After `UPDATE sessions{status=APPROVED}`, there is no API endpoint that allows a status change away from APPROVED. `ApprovedState.transitionTo()` always throws. The UI hides all edit controls once APPROVED is detected.
- **Sharing uses the browser's native URI schemes**: `noteApprovedTemplate()` constructs the email body, then `sendSystemNotification()` fires a `mailto:` URI (or `wa.me/` for WhatsApp, `sms:` for SMS). No email server is required — the doctor's installed mail client opens with a pre-filled message.

```plantuml
@startuml Scenario1_EndToEnd
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam sequenceParticipantBorderColor #555
skinparam sequenceLifeLineBorderColor #888
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
skinparam sequenceGroupBorderColor #999

title Scenario 1 — End-to-End Consultation Workflow\n(Happy Path: Doctor records → AI generates → Doctor approves)

actor "Doctor"              as D
participant "Frontend\n(ScribeStore)"        as FE
participant "/api/transcribe\n+ /api/generate-note" as API
participant "Sarvam AI"     as SAR
participant "Claude Sonnet" as CS
participant "Supabase"      as DB
participant "Observer\nPipeline"             as OBS

D -> FE : Login (credentials)
FE -> DB : Supabase Auth.signInWithPassword()
DB --> FE : user session + JWT
FE -> DB : <<audit>> login_success
note right : JWT stored in browser\nrole = DOCTOR

D -> FE : Select patient → New Session
FE -> DB : INSERT sessions{status=SCHEDULED}
DB --> FE : sessionId
FE -> DB : <<audit>> session_created

D -> FE : Start Recording
FE -> DB : UPDATE sessions{status=IN_PROGRESS}
note right : assertTransition(SCHEDULED → IN_PROGRESS)

D -> FE : Stop Recording
FE -> DB : audio blob → Supabase Storage → audioUrl
FE -> DB : UPDATE sessions{status=RECORDED, audioUrl}

FE -> API : POST /api/transcribe {audioUrl, mimeType}
API -> SAR : speech-to-text API call
SAR --> API : transcript : String
API -> DB : UPDATE sessions{status=TRANSCRIBED, transcription}
note right : RECORDED → TRANSCRIBED\npipeline continues

API -> API : POST /api/extract-entities {transcript}
API -> DB : UPDATE sessions{entities (JSONB)}

API -> API : POST /api/generate-note {transcript, template}
note right : NoteGeneratorFactory selects\nGeneralOpdNoteGenerator (default)
API -> CS : Claude Sonnet SOAP prompt
CS --> API : SoapNote{s, o, a, p, …}
API -> DB : UPDATE sessions{status=UNDER_REVIEW, soap}

API -> OBS : ConsultationEventPublisher.publish()
OBS -> DB : <<audit>> note_ready
OBS -> OBS : DoctorNotifierObserver logs INFO

D -> FE : Open session → Review note
D -> FE : Edit "assessment" field
FE -> DB : UPDATE sessions{edits, soap}
FE -> DB : <<audit>> note_edited

D -> FE : Click Approve
FE -> FE : assertTransition(UNDER_REVIEW → APPROVED)
FE -> DB : UPDATE sessions{status=APPROVED}
FE -> DB : <<audit>> note_approved
note right : Note is LOCKED — immutable\nNo further edits possible

D -> FE : Share note (Email)
FE -> FE : noteApprovedTemplate(patientName, sessionId)
FE -> FE : sendSystemNotification() → mailto:
note right : FR-09 sharing channels:\nEmail / WhatsApp / SMS

@enduml
```

---

## Scenario 2 — Retry & Recovery: Transcription Failure

**What this shows:** The failure path for Step 2 (Sarvam AI transcription), demonstrating how `withRetry()` handles transient API errors and how the system degrades gracefully when all 3 attempts fail. This scenario directly addresses NFR-05 (Reliability).

**Key reliability guarantees demonstrated:**
- **Audio is always preserved before transcription is attempted**: The `audioUrl` is persisted to `sessions{status=RECORDED}` in Step 1, before the Sarvam API is ever called. Even if all 3 retry attempts fail, the doctor's recording is never lost.
- **Session status is never advanced on failure**: The failure branch explicitly leaves `status=RECORDED`. The system does not move the session to any error state — it stays at `RECORDED`, which is a valid retryable state. The doctor can trigger a fresh transcription attempt from the session detail page.
- **Backoff is linear (1s → 2s), not exponential**: This is a deliberate choice for a medical workflow. Exponential backoff could delay recovery by 30+ seconds; linear backoff with a max of 3 attempts keeps the failure fast and predictable.
- **`transcription_failed` is audited**: Even failures are logged. The admin can see from the audit log exactly which sessions experienced transcription errors, when, and how many attempts were made.
- **Graceful degradation message**: On final failure, the `transcriptionFailedTemplate()` notification body is prepared and shown to the doctor. The message includes the session ID so the doctor can locate and retry the correct session.

```plantuml
@startuml Scenario2_RetryReliability
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam sequenceParticipantBorderColor #555
skinparam sequenceLifeLineBorderColor #888
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
skinparam sequenceGroupBorderColor #999

title Scenario 2 — Retry & Reliability\n(Transcription failure → withRetry() → recovery or graceful degradation)

actor "Doctor"        as D
participant "Frontend\n(ScribeStore)"   as FE
participant "/api/transcribe\n(withRetry wrapper)"  as API
participant "Sarvam AI"  as SAR
participant "Supabase"   as DB
participant "Observer\nPipeline"        as OBS

D -> FE : Stop Recording
FE -> DB : UPDATE sessions{status=RECORDED, audioUrl}
FE -> API : POST /api/transcribe {audioUrl}

note over API
  withRetry(fn, maxAttempts=3, baseDelayMs=1000)
  Attempt 1 → wait 1s on fail → Attempt 2 → wait 2s → Attempt 3
end note

group Attempt 1 of 3
  API -> SAR : POST /speech-to-text
  SAR --> API : 503 Service Unavailable
  note right : Sarvam AI transient error
  API -> API : wait 1 000ms…
end

group Attempt 2 of 3
  API -> SAR : POST /speech-to-text (retry)
  SAR --> API : 503 Service Unavailable
  note right : Error persists
  API -> API : wait 2 000ms…
end

group Attempt 3 of 3 — Success path
  API -> SAR : POST /speech-to-text (final retry)
  SAR --> API : 200 OK { transcript: String }
  note right : Recovery — pipeline continues normally
  API -> DB : UPDATE sessions{status=TRANSCRIBED, transcription}
  API -> OBS : publish(ConsultationEvent{RECORDED → TRANSCRIBED})
  OBS -> DB : <<audit>> session_transcribed
end

note over API, SAR : --- OR if all 3 attempts fail ---

group All 3 Attempts Failed — Graceful Degradation
  API -> DB : UPDATE sessions{status=RECORDED}\n(audio preserved — no data loss NFR-05)
  API -> DB : <<audit>> transcription_failed
  API -> OBS : publish(ConsultationEvent{error})
  OBS -> OBS : DoctorNotifierObserver\n→ transcriptionFailedTemplate()
  FE --> D : Show "Transcription failed — retry manually" UI
  note right : Audio is still stored safely.\nDoctor can retry from the session page.
end

note bottom of DB
  NFR-05 Reliability guarantee:
  The session status is NEVER advanced past RECORDED
  on failure. The audioUrl is always preserved.
  Doctor can trigger a fresh transcription attempt
  at any time from the session detail page.
end note

@enduml
```
