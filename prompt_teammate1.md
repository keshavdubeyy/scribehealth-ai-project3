# Prompt for Teammate 1 — Architectural Tactics & Context Diagrams

## Context

You are working on the `report` branch of this repo:
`https://github.com/keshavdubeyy/scribehealth-ai-project3`

The `main` branch does NOT have the `docs/` architecture folders yet.
Your job: create all the files below, commit them in the 10 groups listed, then push to `main`.

## Setup

```bash
git clone https://github.com/keshavdubeyy/scribehealth-ai-project3.git
cd scribehealth-ai-project3
git checkout main
```

## Commit Plan

| # | Files | Commit message |
|---|-------|----------------|
| 1 | `docs/Architectural_Tactics_&_Patterns/1.C4_Context_Diagram.puml` | `docs: add C4 context diagram for ScribeHealth AI` |
| 2 | `docs/Architectural_Tactics_&_Patterns/2.C4_Container_Diagram.puml` | `docs: add C4 container diagram showing frontend/backend/AI pipeline` |
| 3 | `docs/Architectural_Tactics_&_Patterns/3.Component_Diagram_AI_Pipeline.puml` | `docs: add component diagram for AI pipeline (Factory + Template Method)` |
| 4 | `docs/Architectural_Tactics_&_Patterns/4.Sequence_Diagram_Sync_SOAP.puml`<br>`docs/Architectural_Tactics_&_Patterns/5.Sequence_Diagram_Async_Transcription.puml` | `docs: add sequence diagrams for SOAP generation and async transcription` |
| 5 | `docs/Architectural_Tactics_&_Patterns/6.Deployment_Diagram.puml` | `docs: add deployment diagram for dev and prod targets` |
| 6 | `docs/Architectural_Tactics_&_Patterns/7.Data_Model_Diagram.puml` | `docs: add data model diagram (patients, sessions, audit_logs, JSONB shapes)` |
| 7 | `docs/Architectural_Tactics_&_Patterns/8.Factory_Method_Pattern.puml`<br>`docs/Architectural_Tactics_&_Patterns/9.Template_Method_Pattern.puml` | `docs: add Factory Method and Template Method pattern diagrams` |
| 8 | `docs/Architectural_Tactics_&_Patterns/10.Observer_Pattern.puml`<br>`docs/Architectural_Tactics_&_Patterns/11.State_Pattern.puml` | `docs: add Observer and State pattern diagrams` |
| 9 | `docs/Architectural_Tactics_&_Patterns/Architectural Tactics & Patterns.md` | `docs: add architectural tactics and patterns markdown overview` |
| 10 | `docs/Requirements_&_Subsystems/Context and Event flow Diagrams/System_Context_Diagram.puml`<br>`docs/Requirements_&_Subsystems/Context and Event flow Diagrams/Strategic Domain Event Flow.puml` | `docs: add system context diagram and strategic domain event flow` |

---

## File Contents

### `docs/Architectural_Tactics_&_Patterns/1.C4_Context_Diagram.puml`

```plantuml
@startuml C4_Context_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam rectangleBorderColor #555
skinparam arrowColor #444
skinparam actorBorderColor #333
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — C4 Context Diagram

top to bottom direction

actor "Doctor\n(Healthcare Provider)" as Doctor #LightSteelBlue
actor "Administrator\n(Clinic Admin)"    as Admin  #LightSalmon
actor "Patient\n(Recipient)"            as Patient #PaleGreen

rectangle "ScribeHealth AI\n[Software System]\n\nAI-powered medical scribe — records consultations,\ntranscribes audio, extracts medical entities,\ngenerates SOAP notes, manages review-approval workflow." as System #LightYellow

cloud "Sarvam AI\n[External System]\nsaarika:v2.5 Speech-to-Text\n(Hindi / English STT)"       as Sarvam   #FFFACD
cloud "Anthropic Claude\n[External System]\nHaiku (entity extraction)\nSonnet (SOAP generation)" as Claude   #FFF3E0
cloud "Supabase\n[External System]\nPostgreSQL + Storage + Realtime"                             as Supabase #E8F5E9
cloud "Notification Channels\n[External System]\nEmail · WhatsApp · SMS"                         as Notify   #F3E5F5

Doctor  -right-> System   : "Records consultations,\nreviews & approves AI notes\n[HTTPS]"
Admin   -right-> System   : "Manages users,\nviews audit logs\n[HTTPS]"
System  -right-> Patient  : "Shares approved notes\n& prescriptions\n[Email / SMS / WA]"

System  -down->  Sarvam   : "Sends audio buffer,\nreceives transcript [HTTPS REST]"
System  -down->  Claude   : "Sends transcript,\nreceives entities + SOAP note [HTTPS REST]"
System  -down->  Supabase : "Persists patients, sessions,\nnotes, audit logs [TLS]"
System  -down->  Notify   : "Delivers note-ready,\napproved and sharing alerts"

note right of System
  FR-01 to FR-12 fully implemented
  NFR-01: TLS + JWT (8-hr expiry)
  NFR-02: Async transcription pipeline
  NFR-03: Factory + Template Method patterns
  NFR-04: Immutable audit log
  NFR-05: Retry (3× with backoff)
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/2.C4_Container_Diagram.puml`

```plantuml
@startuml C4_Container_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam rectangleBorderColor #555
skinparam arrowColor #444
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — C4 Container Diagram

top to bottom direction

actor "Doctor"        as Doctor #LightSteelBlue
actor "Administrator" as Admin  #LightSalmon

package "ScribeHealth AI [System Boundary]" #FFFFF0 {

  rectangle "Next.js Frontend\n[Container: TypeScript / React 19]\n\nApp Router pages · API routes\nZustand state · audio capture\nsession state machine · review UI" as FE #D6EAF8

  rectangle "Spring Boot Backend\n[Container: Java 17 / Spring Boot 3.2]\n\nREST API · JWT auth filter\nService Layer · Facade · State + Observer\nPatientProfileBuilder (Builder)" as BE #D5F5E3

  rectangle "AI Pipeline\n[Container: Next.js API Routes / TypeScript]\n\nTranscriptionServiceFactory (Factory Method)\nSoapNoteGenerator subclasses (Template Method)\nwithRetry() wrapper (NFR-05)" as AI #FDEBD0

  rectangle "Audit & Admin\n[Container: Java / Spring Boot]\n\nAdminFacade · AuditService\nappend-only audit_logs\nAdmin-only REST endpoints" as Audit #F9EBEA
}

cloud "Supabase\n[External: PostgreSQL + Storage + Realtime]\npatients · sessions · soap · entities\naudit_logs · prescription_templates" as DB     #E8F5E9
cloud "Sarvam AI\n[External: REST API]\nsaarika:v2.5 STT"                      as Sarvam #FFFACD
cloud "Anthropic Claude\n[External: REST API]\nHaiku + Sonnet"                  as Claude #FFF3E0
cloud "Notification Channels\n[External]\nEmail · WhatsApp · SMS"               as Notify #F3E5F5

Doctor -right-> FE : "Uses browser [HTTPS]"
Admin  -right-> FE : "Uses browser [HTTPS]"

FE    -right-> BE    : "Auth, patient & session CRUD\n[REST / Bearer JWT]"
FE    -down->  AI    : "/api/transcribe\n/api/generate-note\n/api/extract-entities"
FE    -down->  DB    : "Direct CRUD via Supabase client\n[TLS / Row-Level Security]"
FE    -down->  Notify : "mailto: / wa.me: / sms:"

BE    -right-> DB    : "JPA / Hibernate [JDBC / TLS]"
BE    -down->  Audit  : "Append audit log on\nevery state change"

AI    -down->  Sarvam : "POST audio buffer [HTTPS]"
AI    -down->  Claude  : "POST transcript prompt\n[HTTPS / Anthropic SDK]"

Audit -down->  DB    : "INSERT audit_logs (append-only)"

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/3.Component_Diagram_AI_Pipeline.puml`

```plantuml
@startuml Component_Diagram_AI_Pipeline
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam componentBorderColor #555
skinparam arrowColor #444
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Component Diagram: AI Pipeline

package "Next.js API Routes (AI Pipeline Container)" {

  component "POST /api/transcribe\n[TranscribeRoute]"        as TR  <<API Route>> #D6EAF8
  component "POST /api/generate-note\n[GenerateNoteRoute]"   as GN  <<API Route>> #D6EAF8
  component "POST /api/extract-entities\n[ExtractEntities]"  as EE  <<API Route>> #D6EAF8

  component "TranscriptionServiceFactory\n[Factory Method]\ncreate(provider?)\nReads TRANSCRIPTION_PROVIDER env" as TSF <<Factory>>   #FDEBD0
  component "TranscriptionProvider\n[Interface]\ntranscribe(audioBuffer, mimeType)"                               as TPI <<Interface>> #E8F5E9
  component "SarvamTranscriptionProvider\n[Concrete Product]\nname = 'sarvam'\nPOST sarvam.ai/speech-to-text"    as STP <<Provider>>   #FFFACD

  component "withRetry()\n[Reliability Wrapper]\nmax 3 attempts\n1s → 2s linear backoff (NFR-05)"                as WR  <<Utility>>   #F9EBEA

  component "NoteGeneratorFactory\n[Selector]\nget(templateName) : SoapNoteGenerator"                            as NGF <<Factory>>   #FDEBD0
  component "SoapNoteGenerator\n[Abstract — Template Method]\ngenerate() · callModel() · normaliseFields()\nspecialtyContext()  [hook]" as SNG <<Abstract>> #E8F5E9
  component "GeneralOpdNoteGenerator\nMentalHealthNoteGenerator\nPhysiotherapyNoteGenerator\nPediatricNoteGenerator\nCardiologyNoteGenerator\nSurgicalFollowupNoteGenerator"  as Generators <<Concrete Subclasses>> #D5F5E3

  component "Claude Haiku\n[Entity Extraction]\nReturns: symptoms, diagnoses,\nmedications, allergies, vitals" as Haiku  <<External AI>> #FFF3E0
  component "Claude Sonnet\n[SOAP Generation]\nclaude-sonnet-4-6 · max_tokens: 2048\nReturns structured JSON note"  as Sonnet <<External AI>> #FFF3E0
}

cloud "Sarvam AI\nsaarika:v2.5" as Sarvam #FFFACD

TR  --> TSF : "create()"
TSF ..> TPI : <<instantiates>>
STP ..|> TPI
TSF --> STP : <<returns>>
TR  --> WR  : "wraps transcribe()"
WR  --> STP : "transcribe(audioBuffer)"
STP --> Sarvam : "POST /speech-to-text"

GN  --> NGF       : "get(templateName)"
NGF ..> Generators : <<selects>>
Generators --|> SNG
GN  --> Sonnet    : "callModel(transcript)"

EE  --> Haiku     : "POST extract-entities prompt"

note right of WR
  NFR-05: Reliability
  Audio preserved even if
  note generation fails
end note

note right of TSF
  NFR-03: Extensibility
  New provider = 1 new class
  + 1 env var change
end note

note right of SNG
  NFR-03: Extensibility
  New specialty = 1 new subclass
  API route unchanged
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/4.Sequence_Diagram_Sync_SOAP.puml`

```plantuml
@startuml Sequence_Diagram_Sync_SOAP
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceLifeLineBorderColor #888
skinparam sequenceParticipantBorderColor #555
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFFF0
hide footbox

title ScribeHealth AI — Synchronous SOAP Note Generation Flow\n(FR-06, FR-07, NFR-02, NFR-03)

actor "Doctor" as D
participant "Frontend\n(ScribeStore)" as FE
participant "/api/generate-note" as API
participant "NoteGeneratorFactory" as NGF
participant "SoapNoteGenerator\n(Template Method)" as SNG
participant "Claude Sonnet" as CL
database "Supabase" as DB

D -> FE : Trigger note generation\n(transcript ready, template selected)
activate FE

FE -> FE : assertTransition(TRANSCRIBED → UNDER_REVIEW)
note right : FR-11: State Machine enforcement

FE -> API : POST /api/generate-note\n{transcript, templateName, sessionId}
activate API

API -> NGF : NoteGeneratorFactory.get(templateName)
activate NGF
NGF --> API : SoapNoteGenerator\n(e.g. CardiologyNoteGenerator)
deactivate NGF

note right of NGF
  NFR-03: Extensibility
  New specialty = new subclass only
  Factory selects correct generator
end note

API -> SNG : generator.generate(transcript, anthropicClient)
activate SNG

SNG -> SNG : specialtyContext() → specialty-aware prompt suffix

SNG -> CL : messages.create({\n  model: "claude-sonnet-4-6",\n  max_tokens: 2048,\n  messages: [specialtyPrompt + transcript]\n})
activate CL

note right of CL
  Prompt includes:
  - Specialty context
  - Transcript text
  - Required field keys
  - JSON-only instruction
end note

CL --> SNG : {content: [{type:"text", text:"{...JSON}"}]}
deactivate CL

SNG -> SNG : extractJson(text)\nnormaliseFields(raw)

SNG --> API : Record<string,string>\n{subjective, objective, assessment, plan, …}
deactivate SNG

API --> FE : {soap: SoapNote, templateName}
deactivate API

FE -> DB : UPDATE sessions SET\n  status='UNDER_REVIEW', soap=<jsonb>
DB --> FE : OK

FE -> DB : INSERT audit_logs {action:'note_generated'}

FE --> D : SOAP note displayed in review editor
deactivate FE

note over D, DB
  Target: < 500 ms for DB ops (NFR-02).
  Claude latency ~1–3 s (external — async from user perspective).
  Note is UNDER_REVIEW until Doctor approves (NFR-01 human-in-the-loop).
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/5.Sequence_Diagram_Async_Transcription.puml`

```plantuml
@startuml Sequence_Diagram_Async_Transcription
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceLifeLineBorderColor #888
skinparam sequenceParticipantBorderColor #555
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFFF0
hide footbox

title ScribeHealth AI — Async Transcription + Retry Flow\n(FR-03, FR-04, FR-11, NFR-02, NFR-05)

actor "Doctor" as D
participant "Frontend\n(ScribeStore)" as FE
participant "MediaRecorder\n(Browser)" as MR
participant "Supabase\nStorage" as S3
participant "/api/transcribe" as API
participant "TranscriptionFactory" as TSF
participant "SarvamProvider" as STP
participant "Sarvam AI" as SAR
database "Supabase\n(sessions)" as DB

== Recording Phase (FR-03) ==

D -> FE : Click "Start Recording"
FE -> FE : assertTransition(SCHEDULED → IN_PROGRESS)
FE -> DB : UPDATE sessions {status='IN_PROGRESS'}
FE -> MR : MediaRecorder.start()
activate MR
note right : Audio captured — WebM/Opus format

D -> FE : Click "Stop Recording"
FE -> MR : MediaRecorder.stop()
MR --> FE : Blob (audio/webm)
deactivate MR

FE -> FE : assertTransition(IN_PROGRESS → RECORDED)
FE -> S3 : Upload audio blob → sessions/{id}/recording.webm
S3 --> FE : audioUrl
FE -> DB : UPDATE sessions {status='RECORDED', audioUrl}

== Async Transcription Phase (FR-04, NFR-02, NFR-05) ==

note over FE, SAR
  Transcription runs server-side — UI is NOT blocked.
  Doctor sees a spinner while pipeline processes asynchronously.
end note

FE -> API : POST /api/transcribe {audioBuffer, mimeType}
activate API

API -> TSF : TranscriptionServiceFactory.create('sarvam')
activate TSF
TSF --> API : SarvamTranscriptionProvider
deactivate TSF

note right of TSF
  NFR-03: Factory Method
  Swap to Whisper / Google STT
  with 1 new class + 1 env var
end note

loop Attempt 1..3 (NFR-05 Reliability)
  API -> STP : provider.transcribe(audioBuffer, mimeType)
  activate STP
  STP -> SAR : POST api.sarvam.ai/speech-to-text\n{file, model:'saarika:v2.5'}
  activate SAR

  alt Success
    SAR --> STP : {transcript: "Patient reports…"}
    STP --> API : transcript : String
    deactivate SAR
    deactivate STP
  else Failure (network / 5xx)
    SAR --> STP : HTTP 5xx / timeout
    deactivate SAR
    STP --> API : throw Error
    deactivate STP
    API -> API : wait backoff(attempt) then retry
    note right : Attempt 1 → 1s · Attempt 2 → 2s\nAttempt 3 → throw
  end
end

API --> FE : {transcript: string}
deactivate API

FE -> FE : assertTransition(RECORDED → TRANSCRIBED)
FE -> DB : UPDATE sessions {status='TRANSCRIBED', transcription}
DB --> FE : OK

FE -> DB : INSERT audit_logs {action:'transcription_complete'}

note over FE
  Pipeline continues automatically:
  → Extract entities (Claude Haiku)
  → Generate SOAP note (Claude Sonnet)
  → Status → UNDER_REVIEW
end note

FE --> D : Transcript displayed\nPipeline advances to entity extraction

== Failure Path (NFR-05) ==

note over API, DB
  If all 3 attempts fail:
  - Session stays in RECORDED status (no data loss)
  - Error surfaced to UI — doctor can manually retry
  - audioUrl always preserved in Supabase Storage
  - Audit log records failure event
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/6.Deployment_Diagram.puml`

```plantuml
@startuml Deployment_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam nodeBorderColor #555
skinparam arrowColor #444
skinparam componentBorderColor #777
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Deployment Diagram (Dev & Prod Targets)

' ─── DEVELOPMENT ──────────────────────────────────────────────
node "Developer Workstation\n[macOS / Linux]" as DEV #E8F5E9 {
  component "Next.js Dev Server\n(localhost:3000)\nnext dev · Hot reload" as FEDev
  component "Spring Boot\n(localhost:8080)\nmvn spring-boot:run · DevTools" as BEDev
  component "Environment: .env.local\nSARVAM_API_KEY · ANTHROPIC_API_KEY\nSUPABASE_URL · JWT_SECRET\nTRANSCRIPTION_PROVIDER=sarvam" as EnvDev
}

' ─── PRODUCTION ───────────────────────────────────────────────
node "Vercel Edge Network\n[Production Frontend]" as VERCEL #D6EAF8 {
  component "Next.js App Router\nServerless Functions (API Routes)\nEdge-cached static assets" as FEProd
  component "Env: SARVAM_API_KEY · ANTHROPIC_API_KEY\nSUPABASE_URL · SUPABASE_SERVICE_KEY\nNEXTAUTH_SECRET · NEXTAUTH_URL" as EnvProd
}

node "Cloud VM / Container Host\n[Production Backend]" as CLOUD #FDEBD0 {
  component "Spring Boot JAR\njava -jar scribehealth.jar\nJWT filter chain · Service Layer\nFacade · State + Observer patterns" as BEProd
}

' ─── EXTERNAL SERVICES ────────────────────────────────────────
cloud "Supabase Cloud\n[Managed PostgreSQL + Storage]" as SUPA #E8F5E9 {
  component "PostgreSQL\n(profiles · patients · sessions\naudit_logs · prescription_templates)" as PGDB
  component "Supabase Storage\n(audio recordings · prescription images)" as STG
  component "Supabase Realtime\n(audit log live feed)" as RT
}

cloud "Sarvam AI\n[api.sarvam.ai]" as SARVAM #FFFACD {
  component "saarika:v2.5\nSpeech-to-Text API" as STT
}

cloud "Anthropic API\n[api.anthropic.com]" as ANTHROPIC #FFF3E0 {
  component "claude-haiku-4-5\n(entity extraction)" as HAIKU
  component "claude-sonnet-4-6\n(SOAP generation)" as SONNET
}

' ─── DEV CONNECTIONS ──────────────────────────────────────────
FEDev -right-> BEDev : "REST / JWT [localhost:8080]"
FEDev -down->  PGDB  : "Supabase JS client [TLS]"
BEDev -down->  PGDB  : "JDBC / JPA [TLS]"
FEDev -right-> STT   : "POST audio [HTTPS]"
FEDev -right-> HAIKU  : "POST prompt [HTTPS]"
FEDev -right-> SONNET : "POST prompt [HTTPS]"

' ─── PROD CONNECTIONS ─────────────────────────────────────────
FEProd -down-> BEProd : "REST / Bearer JWT [HTTPS]"
FEProd -down-> PGDB   : "Supabase JS client [TLS / RLS]"
BEProd -down-> PGDB   : "JDBC / JPA [TLS]"
FEProd -right-> STT    : "POST audio buffer [HTTPS]"
FEProd -right-> HAIKU   : "POST entity-extraction [HTTPS]"
FEProd -right-> SONNET  : "POST SOAP generation [HTTPS]"
FEProd -down-> STG    : "Upload audio [HTTPS]"
FEProd -down-> RT     : "Subscribe audit feed [WebSocket]"

note bottom of SUPA
  NFR-01: TLS enforced at all layers
  NFR-04: audit_logs append-only (no UPDATE/DELETE)
  NFR-05: Supabase manages HA + backups
end note

note bottom of VERCEL
  NFR-02: Serverless lambdas scale to zero
  Cold start < 200ms for CRUD routes
  Static assets served from CDN edge
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/7.Data_Model_Diagram.puml`

```plantuml
@startuml Data_Model_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Data Model Diagram\n(patients · sessions · entities · SOAP notes · audit logs)

top to bottom direction

package "Auth & Access" #EAF2FF {
  class profiles <<Supabase Table>> {
    + email : text  <<PK>>
    + name : text
    + role : text  <<DOCTOR | ADMIN>>
    + password_hash : text
    + is_active : boolean  <<default: true>>
    + specialization : text
    + license_number : text
    + created_at : timestamptz
    + last_login_at : timestamptz
  }
}

package "Patient & Session" #E9F7EF {
  class patients <<Supabase Table>> {
    + id : text  <<PK, UUID>>
    + doctor_email : text  <<FK → profiles.email>>
    + name : text
    + age : integer
    + gender : text
    + email : text
    + phone : text
    + chronic_conditions : jsonb
    + allergies : jsonb
    + emergency_contact : jsonb
    + insurance_details : jsonb
    + created_at : timestamptz
  }

  class sessions <<Supabase Table>> {
    + id : text  <<PK, UUID>>
    + patient_id : text  <<FK → patients.id>>
    + doctor_email : text  <<FK → profiles.email>>
    + status : text  <<see SessionStatus>>
    + transcription : text
    + audio_url : text
    + soap : jsonb  <<SoapNote>>
    + entities : jsonb  <<MedicalEntities>>
    + edits : jsonb
    + created_at : timestamptz
    + updated_at : timestamptz
  }
}

package "Inline JSONB Shapes" #FEF9E7 {
  class SoapNote <<JSONB shape>> {
    + s : text  (Subjective)
    + o : text  (Objective)
    + a : text  (Assessment)
    + p : text  (Plan)
    + diagnosis : text
    + prescription : text
    + advice : text
    + follow_up : text
    .. specialty extras ..
    + safety_assessment : text  (MentalHealth)
    + wound_assessment : text  (Surgical)
    + home_exercise_program : text  (Physio)
    + parent_instructions : text  (Pediatric)
    + medications : text  (Cardiology)
  }

  class MedicalEntities <<JSONB shape>> {
    + symptoms : text[]
    + diagnoses : text[]
    + medications : jsonb[]  {name, dosage, frequency}
    + allergies : jsonb[]  {substance, severity}
    + vitals : jsonb[]  {metric, value, unit}
    + treatment_plans : text[]
  }
}

package "Session State" #F4F6F7 {
  class SessionStatus <<enum>> {
    SCHEDULED
    IN_PROGRESS
    RECORDED
    TRANSCRIBED
    UNDER_REVIEW
    APPROVED  <<terminal>>
    REJECTED
  }
}

package "Audit & Admin" #FDEDEC {
  class audit_logs <<Supabase Table — append-only>> {
    + id : uuid  <<PK, auto>>
    + user_email : text
    + action : text
    + entity_type : text
    + entity_id : text
    + metadata : jsonb
    + created_at : timestamptz  <<immutable>>
    .. actions ..
    login_success · logout
    patient_created · patient_updated · patient_deleted
    session_created · session_deleted
    note_generated · note_regenerated
    note_edited · note_approved · note_rejected
    notification_sent
  }
}

package "Prescription" #EAF2FF {
  class prescription_templates <<Supabase Table>> {
    + id : text  <<PK, UUID>>
    + doctor_email : text  <<FK → profiles.email>>
    + image_path : text
    + image_url : text
    + image_width : integer
    + image_height : integer
    + safe_zone : jsonb
    + created_at : timestamptz
  }
}

' Relationships
profiles "1" -- "0..*" patients : "doctor_email"
profiles "1" -- "0..*" sessions : "doctor_email"
profiles "1" -- "0..1" prescription_templates : "doctor_email"
patients "1" -- "0..*" sessions : "patient_id"

sessions "1" *-- "1" SoapNote         : "soap (jsonb)"
sessions "1" *-- "1" MedicalEntities  : "entities (jsonb)"
sessions --> SessionStatus             : "status"

note right of audit_logs
  NFR-04: No UPDATE or DELETE
  ever issued on this table.
  Admin-only via AdminFacade.
end note

note right of sessions
  soap and entities stored as
  PostgreSQL JSONB — schema-flexible,
  indexed, and queryable.
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/8.Factory_Method_Pattern.puml`

```plantuml
@startuml Factory_Method_Pattern
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
hide empty members

title ScribeHealth AI — Factory Method Pattern\nTranscriptionServiceFactory (NFR-03: Extensibility)

note as N1
  Pattern: Factory Method (GoF Creational)
  Location: frontend/lib/transcription-factory.ts
  NFR addressed: NFR-03 Extensibility
  Motivation: New provider (Whisper, Google STT) requires
  only a new implementing class + 1 env var change.
  Zero changes to API routes or calling code.
end note

package "Product Interface" #E8F5E9 {
  interface TranscriptionProvider {
    + name : string  <<readonly>>
    + transcribe(audioBuffer: Buffer, mimeType?: string) : Promise<string>
  }
}

package "Concrete Products" #FFFACD {
  class SarvamTranscriptionProvider {
    + name = "sarvam"
    - apiKey : string
    + transcribe(audioBuffer, mimeType?) : Promise<string>
    .. internals ..
    POST https://api.sarvam.ai/speech-to-text
    FormData {file, model:"saarika:v2.5"}
  }

  class WhisperProvider <<(future extension)>> #F4F6F7 {
    + name = "whisper"
    + transcribe(audioBuffer, mimeType?) : Promise<string>
  }

  class GoogleSttProvider <<(future extension)>> #F4F6F7 {
    + name = "google"
    + transcribe(audioBuffer, mimeType?) : Promise<string>
  }
}

package "Creator (Factory)" #FDEBD0 {
  class TranscriptionServiceFactory {
    + {static} create(provider?: string) : TranscriptionProvider
    .. logic ..
    Reads: process.env.TRANSCRIPTION_PROVIDER
    Default: "sarvam"
    switch(provider):
      "sarvam"  → new SarvamTranscriptionProvider()
      "whisper" → new WhisperProvider()
      default   → throw Error("Unknown provider")
  }
}

package "Client (API Route)" #D6EAF8 {
  class TranscribeRoute <<POST /api/transcribe>> {
    + POST(request) : NextResponse
    .. uses ..
    const provider = TranscriptionServiceFactory.create()
    const transcript = await withRetry(() => provider.transcribe(...))
  }
}

SarvamTranscriptionProvider ..|> TranscriptionProvider
WhisperProvider             ..|> TranscriptionProvider
GoogleSttProvider           ..|> TranscriptionProvider

TranscriptionServiceFactory ..> TranscriptionProvider         : <<creates & returns>>
TranscriptionServiceFactory ..> SarvamTranscriptionProvider   : <<instantiates (current)>>
TranscriptionServiceFactory ..> WhisperProvider               : <<instantiates (future)>>
TranscriptionServiceFactory ..> GoogleSttProvider             : <<instantiates (future)>>

TranscribeRoute --> TranscriptionServiceFactory : "create()"
TranscribeRoute --> TranscriptionProvider       : "provider.transcribe(audioBuffer)"

note bottom of TranscriptionServiceFactory
  Extension rule (Open/Closed Principle):
  1. Implement TranscriptionProvider interface
  2. Add a case in the switch statement
  3. Set TRANSCRIPTION_PROVIDER env var
  → No other code changes required
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/9.Template_Method_Pattern.puml`

```plantuml
@startuml Template_Method_Pattern
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
hide empty members

title ScribeHealth AI — Template Method Pattern\nSoapNoteGenerator (NFR-03: Extensibility)

note as N1
  Pattern: Template Method (GoF Behavioral)
  Location: frontend/lib/soap-note-generator.ts
  NFR addressed: NFR-03 Extensibility
  Motivation: All SOAP generators follow the same algorithm skeleton.
  Only specialty context and field list vary per template.
  New specialty = 1 new subclass. API route is never modified.
end note

package "Abstract Class (Template)" #E8F5E9 {
  abstract class SoapNoteGenerator {
    + {abstract} templateName : string
    + {abstract} fields : readonly string[]
    + generate(transcript, client: Anthropic) : Promise<Record<string,string>>
    .. Template Method — fixed skeleton ..
      1. specialtyContext() → context string
      2. callModel(transcript, client) → raw JSON
      3. normaliseFields(raw) → keyed result
    # specialtyContext() : string  <<hook — override in subclass>>
    - callModel(transcript, client) : Promise<Record<string,string>>  <<invariant>>
    - normaliseFields(raw) : Record<string,string>  <<invariant>>
  }
}

package "Concrete Subclasses" #FFFACD {
  class GeneralOpdNoteGenerator {
    + templateName = "general_opd"
    + fields = [subjective, objective, assessment,\n  diagnosis, prescription, advice, follow_up]
  }

  class MentalHealthNoteGenerator {
    + templateName = "mental_health_soap"
    + fields = [subjective, objective, assessment,\n  plan, safety_assessment]
    # specialtyContext() → "mental health and psychiatry"
  }

  class PhysiotherapyNoteGenerator {
    + templateName = "physiotherapy"
    + fields = [subjective, objective, assessment,\n  treatment, home_exercise_program, plan]
    # specialtyContext() → "physiotherapy and rehabilitation"
  }

  class PediatricNoteGenerator {
    + templateName = "pediatric"
    + fields = [subjective, objective, assessment,\n  plan, parent_instructions, follow_up]
    # specialtyContext() → "paediatrics"
  }

  class CardiologyNoteGenerator {
    + templateName = "cardiology"
    + fields = [subjective, objective, assessment,\n  plan, medications, follow_up]
    # specialtyContext() → "cardiology and cardiovascular medicine"
  }

  class SurgicalFollowupNoteGenerator {
    + templateName = "surgical_followup"
    + fields = [wound_assessment, subjective, objective,\n  assessment, plan, next_review]
    # specialtyContext() → "post-operative surgical follow-up"
  }

  class NewSpecialtyGenerator <<(future extension)>> #F4F6F7 {
    + templateName = "new_specialty"
    + fields = [...]
    # specialtyContext() → "..."
  }
}

package "Selector" #FDEBD0 {
  class NoteGeneratorFactory {
    - GENERATORS : SoapNoteGenerator[]
    + {static} get(templateName: string) : SoapNoteGenerator
    + {static} templateNames() : string[]
    .. logic ..
    GENERATORS.find(g => g.templateName === name)
    ?? new GeneralOpdNoteGenerator()
  }
}

package "Client" #D6EAF8 {
  class GenerateNoteRoute <<POST /api/generate-note>> {
    + POST(req) : NextResponse
    .. uses ..
    const gen = NoteGeneratorFactory.get(templateName)
    const soap = await gen.generate(transcript, anthropicClient)
  }
}

GeneralOpdNoteGenerator       --|> SoapNoteGenerator
MentalHealthNoteGenerator     --|> SoapNoteGenerator
PhysiotherapyNoteGenerator    --|> SoapNoteGenerator
PediatricNoteGenerator        --|> SoapNoteGenerator
CardiologyNoteGenerator       --|> SoapNoteGenerator
SurgicalFollowupNoteGenerator --|> SoapNoteGenerator
NewSpecialtyGenerator         --|> SoapNoteGenerator

NoteGeneratorFactory  ..> SoapNoteGenerator  : <<selects & returns>>
GenerateNoteRoute --> NoteGeneratorFactory    : "NoteGeneratorFactory.get(templateName)"
GenerateNoteRoute --> SoapNoteGenerator       : "gen.generate(transcript, client)"

note bottom of NoteGeneratorFactory
  Extension rule (Open/Closed Principle):
  1. Extend SoapNoteGenerator
  2. Set templateName + fields
  3. Override specialtyContext() if needed
  4. Add instance to GENERATORS array
  → Zero changes to API routes or calling code
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/10.Observer_Pattern.puml`

```plantuml
@startuml Observer_Pattern
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
hide empty members

title ScribeHealth AI — Observer Pattern\nConsultationEventPublisher (FR-12, NFR-04)

note as N1
  Pattern: Observer (GoF Behavioral)
  Location: backend/java/.../lifecycle/observer/
  FRs addressed: FR-12 (automatic notifications on lifecycle events)
  NFR addressed: NFR-04 (every transition audited via AuditLoggerObserver)
  Motivation: Decouple session lifecycle from notification and audit concerns.
  New observers added without touching SessionServiceImpl.
end note

package "Event" #FEF9E7 {
  class ConsultationEvent {
    - sessionId : String
    - doctorEmail : String
    - fromStatus : String
    - toStatus : String
    + getSessionId() : String
    + getDoctorEmail() : String
    + getFromStatus() : String
    + getToStatus() : String
  }
}

package "Observer Interface" #E8F5E9 {
  interface ConsultationObserver {
    + onEvent(event : ConsultationEvent) : void
  }
}

package "Publisher (Subject)" #FDEBD0 {
  class ConsultationEventPublisher <<@Component>> {
    - observers : List<ConsultationObserver>
    + subscribe(observer) : void
    + unsubscribe(observer) : void
    + publish(event : ConsultationEvent) : void
  }
}

package "Concrete Observers" #FFFACD {
  class AuditLoggerObserver <<@Component>> {
    - auditService : AuditService
    + onEvent(event : ConsultationEvent) : void
    .. maps toStatus → audit action ..
    UNDER_REVIEW → "note_ready"
    APPROVED     → "note_approved"
    REJECTED     → "note_rejected"
    IN_PROGRESS  → "session_started"
    RECORDED     → "recording_complete"
    TRANSCRIBED  → "transcription_complete"
  }

  class DoctorNotifierObserver <<@Component>> {
    + onEvent(event : ConsultationEvent) : void
    .. logs INFO for relevant transitions ..
    UNDER_REVIEW → "Note ready for review"
    APPROVED     → "Note approved"
    REJECTED     → "Note rejected — regeneration available"
  }

  class SessionStatusObserver <<@Component>> {
    + onEvent(event : ConsultationEvent) : void
    .. logs all lifecycle transitions ..
    "{sessionId}: {fromStatus} → {toStatus}"
  }

  class FutureObserver <<extensible>> #F4F6F7 {
    + onEvent(event : ConsultationEvent) : void
    .. e.g. SMS notifier, push notification ..
  }
}

package "Publisher Caller" #D6EAF8 {
  class SessionServiceImpl <<@Service>> {
    - publisher : ConsultationEventPublisher
    + transitionSession(email, id, targetStatus) : ClinicalSession
  }
}

package "Audit Service" #FDEDEC {
  interface AuditService {
    + log(userEmail, action, entityType, entityId) : void
  }
}

ConsultationObserver <|.. AuditLoggerObserver
ConsultationObserver <|.. DoctorNotifierObserver
ConsultationObserver <|.. SessionStatusObserver
ConsultationObserver <|.. FutureObserver

ConsultationEventPublisher "1" o-- "0..*" ConsultationObserver : "observers list"
ConsultationEventPublisher ..> ConsultationEvent : "publishes"

AuditLoggerObserver --> AuditService : "log()"
SessionServiceImpl  --> ConsultationEventPublisher : "publish(event)"
SessionServiceImpl  ..> ConsultationEvent          : "new ConsultationEvent(...)"

note bottom of AuditLoggerObserver
  NFR-04: Every state transition
  automatically writes an immutable
  row to audit_logs via AuditService.
  Publisher never calls audit directly.
end note

note bottom of ConsultationEventPublisher
  Extension rule:
  1. Implement ConsultationObserver
  2. Annotate with @Component
  3. Spring auto-wires and subscribes
  → Zero changes to SessionServiceImpl
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/11.State_Pattern.puml`

```plantuml
@startuml State_Pattern
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA
hide empty members

title ScribeHealth AI — State Pattern\nConsultation Lifecycle (FR-11, NFR-04, NFR-05)

note as N1
  Pattern: State (GoF Behavioral)
  Locations:
    Java — backend/java/.../lifecycle/state/
    TypeScript — frontend/lib/session-state-machine.ts
  FRs addressed: FR-11 (illegal transitions blocked), FR-12 (events on transition)
  NFRs addressed: NFR-04 (every transition audited), NFR-05 (state persisted)
  Motivation: Enforce 7-state consultation lifecycle as a first-class domain object.
  Illegal jumps throw IllegalStateTransitionException before any DB write.
end note

package "State Interface" #E8F5E9 {
  interface ConsultationState {
    + statusName() : String
    + transitionTo(targetStatus : String) : ConsultationState
  }
}

package "Concrete States" #FFFACD {
  class ScheduledState {
    + statusName() = "SCHEDULED"
    + transitionTo("IN_PROGRESS") : InProgressState
  }
  class InProgressState {
    + statusName() = "IN_PROGRESS"
    + transitionTo("RECORDED") : RecordedState
  }
  class RecordedState {
    + statusName() = "RECORDED"
    + transitionTo("TRANSCRIBED") : TranscribedState
  }
  class TranscribedState {
    + statusName() = "TRANSCRIBED"
    + transitionTo("UNDER_REVIEW") : UnderReviewState
  }
  class UnderReviewState {
    + statusName() = "UNDER_REVIEW"
    + transitionTo("APPROVED") : ApprovedState
    + transitionTo("REJECTED") : RejectedState
  }
  class ApprovedState <<terminal>> {
    + statusName() = "APPROVED"
    + transitionTo(any) → throw
  }
  class RejectedState {
    + statusName() = "REJECTED"
    + transitionTo("UNDER_REVIEW") : UnderReviewState
  }
}

package "Factory" #FDEBD0 {
  class ConsultationStateFactory {
    + {static} fromStatus(status : String) : ConsultationState
    .. switch(status) ..
    "SCHEDULED"    → new ScheduledState()
    "IN_PROGRESS"  → new InProgressState()
    "RECORDED"     → new RecordedState()
    "TRANSCRIBED"  → new TranscribedState()
    "UNDER_REVIEW" → new UnderReviewState()
    "APPROVED"     → new ApprovedState()
    "REJECTED"     → new RejectedState()
    default        → throw IllegalArgumentException
  }
}

package "Exception" #FDEDEC {
  class IllegalStateTransitionException {
    + IllegalStateTransitionException(from : String, to : String)
  }
}

package "Context (Service)" #D6EAF8 {
  class SessionServiceImpl <<@Service>> {
    + transitionSession(email, id, targetStatus) : ClinicalSession
    .. flow ..
    1. Load session from DB
    2. currentState = ConsultationStateFactory.fromStatus(session.status)
    3. nextState = currentState.transitionTo(targetStatus)
    4. session.status = nextState.statusName()
    5. sessionRepository.save(session)
    6. publisher.publish(ConsultationEvent)
  }
}

package "Frontend Mirror (TypeScript)" #EAF2FF {
  class SessionStateMachine <<TS module>> {
    + {static} VALID_TRANSITIONS : Record<SessionStatus, SessionStatus[]>
    .. SCHEDULED    → [IN_PROGRESS] ..
    .. IN_PROGRESS  → [RECORDED] ..
    .. RECORDED     → [TRANSCRIBED] ..
    .. TRANSCRIBED  → [UNDER_REVIEW] ..
    .. UNDER_REVIEW → [APPROVED, REJECTED] ..
    .. APPROVED     → []  (terminal) ..
    .. REJECTED     → [UNDER_REVIEW] ..
    + {static} canTransition(from, to) : boolean
    + {static} assertTransition(from, to) : void
  }
}

ScheduledState   ..|> ConsultationState
InProgressState  ..|> ConsultationState
RecordedState    ..|> ConsultationState
TranscribedState ..|> ConsultationState
UnderReviewState ..|> ConsultationState
ApprovedState    ..|> ConsultationState
RejectedState    ..|> ConsultationState

ConsultationState           ..> IllegalStateTransitionException : <<throws on invalid>>
ConsultationStateFactory    ..> ConsultationState              : <<creates>>
SessionServiceImpl --> ConsultationStateFactory                 : "fromStatus(session.status)"
SessionServiceImpl --> ConsultationState                        : "currentState.transitionTo(target)"

note right of ApprovedState
  NFR-05: APPROVED is terminal.
  No edit or transition permitted
  after approval. Note locked.
end note

note right of SessionStateMachine
  FR-11 enforced client-side too —
  assertTransition() called in ScribeStore
  before any API call.
end note

@enduml

```

---

### `docs/Architectural_Tactics_&_Patterns/Architectural Tactics & Patterns.md`

```markdown
# ScribeHealth AI — Architectural Tactics & Patterns

> Diagrams in this folder document how ScribeHealth AI satisfies its Non-Functional Requirements through concrete architectural tactics and GoF design patterns.
> Each `.puml` file is self-contained and renderable with PlantUML.

---

## Folder Contents

| # | File | Diagram Type | FRs / NFRs |
|---|------|-------------|-----------|
| 1 | `1.C4_Context_Diagram.puml` | C4 Context | FR-01–12 · NFR-01–05 |
| 2 | `2.C4_Container_Diagram.puml` | C4 Container | NFR-01, NFR-02, NFR-03 |
| 3 | `3.Component_Diagram_AI_Pipeline.puml` | Component | FR-04–07 · NFR-02, NFR-03, NFR-05 |
| 4 | `4.Sequence_Diagram_Sync_SOAP.puml` | Sequence | FR-06, FR-07, FR-11 · NFR-01, NFR-02, NFR-03 |
| 5 | `5.Sequence_Diagram_Async_Transcription.puml` | Sequence | FR-03, FR-04, FR-11 · NFR-02, NFR-03, NFR-05 |
| 6 | `6.Deployment_Diagram.puml` | Deployment | NFR-01, NFR-02, NFR-04, NFR-05 |
| 7 | `7.Data_Model_Diagram.puml` | Data Model | FR-01–12 · NFR-01, NFR-04 |
| 8 | `8.Factory_Method_Pattern.puml` | Class | NFR-03 |
| 9 | `9.Template_Method_Pattern.puml` | Class | NFR-03 |
| 10 | `10.Observer_Pattern.puml` | Class | FR-12 · NFR-04 |
| 11 | `11.State_Pattern.puml` | Class | FR-11 · NFR-04, NFR-05 |

---

## 1. C4 Context Diagram

**File:** `1.C4_Context_Diagram.puml`

Shows ScribeHealth AI as a black box within its environment, with all external actors and systems it interacts with.

**Actors:**
- **Doctor** — records consultations, reviews and approves AI-generated notes, manages patients
- **Administrator** — manages user accounts, views audit logs
- **Patient** — receives approved notes and prescriptions via Email/WhatsApp/SMS

**External Systems:**
- **Sarvam AI** (`saarika:v2.5`) — Hindi/English speech-to-text transcription
- **Anthropic Claude** (Haiku + Sonnet) — medical entity extraction and SOAP note generation
- **Supabase** — PostgreSQL database, file storage, and real-time feed
- **Notification Channels** — Email (`mailto:`), WhatsApp (`wa.me/`), SMS (`sms:`)

**Architectural significance:** Establishes the trust boundary — all PHI stays within the system boundary; only transcripts and prompts cross to AI APIs over TLS (NFR-01).

---

## 2. C4 Container Diagram

**File:** `2.C4_Container_Diagram.puml`

Decomposes ScribeHealth AI into four containers and shows how they communicate.

| Container | Technology | Role |
|-----------|-----------|------|
| Next.js Frontend | TypeScript / React 19 | UI, audio capture, state machine, review workflow |
| Spring Boot Backend | Java 17 / Spring Boot 3.2 | Auth, patient/session CRUD, state + observer patterns |
| AI Pipeline | Next.js API Routes (TypeScript) | Transcription factory, SOAP generator, retry wrapper |
| Audit & Admin | Java / Spring Boot | AdminFacade, append-only audit log, admin endpoints |

**Key tactic — Separation of Concerns (NFR-03):** Each pipeline stage (recording → transcription → NLP → generation) is an isolated container with a defined interface. The AI Pipeline container is independently deployable and can be swapped without touching the backend.

---

## 3. Component Diagram — AI Pipeline

**File:** `3.Component_Diagram_AI_Pipeline.puml`

Zooms into the AI Pipeline container to show the internal components and their interactions.

**Key components:**
- `TranscribeRoute` (`POST /api/transcribe`) — entry point for audio processing
- `TranscriptionServiceFactory` — Factory Method; selects provider from `TRANSCRIPTION_PROVIDER` env var
- `SarvamTranscriptionProvider` — concrete product; calls Sarvam AI REST API
- `withRetry()` — reliability wrapper; up to 3 attempts with 1s → 2s backoff (NFR-05)
- `NoteGeneratorFactory` — selects the correct `SoapNoteGenerator` subclass by template name
- `SoapNoteGenerator` — abstract Template Method base; `callModel()` and `normaliseFields()` are invariant
- Concrete generators (GeneralOPD, MentalHealth, Physio, Pediatric, Cardiology, SurgicalFollowup)

**Architectural significance:** All three extensibility axes (provider, template, fields) are isolated behind stable interfaces. The `GenerateNoteRoute` and `TranscribeRoute` API routes never change when new providers or specialties are added.

---

## 4. Sequence Diagram — Synchronous SOAP Note Generation

**File:** `4.Sequence_Diagram_Sync_SOAP.puml`

Traces the request path when a doctor triggers SOAP note generation after transcription.

**Flow:**
1. Doctor triggers generation; `assertTransition(TRANSCRIBED → UNDER_REVIEW)` validates the state (FR-11)
2. `POST /api/generate-note` resolves the correct generator via `NoteGeneratorFactory`
3. Generator builds a specialty-aware prompt and calls Claude Sonnet (`claude-sonnet-4-6`, max 2048 tokens)
4. Response is parsed via `extractJson()` and normalised — missing fields filled with `""`
5. Session status updated to `UNDER_REVIEW` and `note_generated` audit entry written

**NFR-02 performance target:** DB writes complete in < 500ms. Claude latency (~1–3s) is external and presented asynchronously to the user.
**NFR-01 human-in-the-loop:** The SOAP note is in `UNDER_REVIEW` — it cannot enter permanent records without explicit doctor approval.

---

## 5. Sequence Diagram — Async Transcription + Retry Flow

**File:** `5.Sequence_Diagram_Async_Transcription.puml`

Traces the full recording and transcription pipeline including the reliability retry mechanism.

**Flow:**
1. Doctor starts/stops recording; `MediaRecorder` captures audio as WebM/Opus blob
2. State machine enforces `SCHEDULED → IN_PROGRESS → RECORDED` transitions (FR-11)
3. Audio blob uploaded to Supabase Storage; `audioUrl` persisted on session
4. `POST /api/transcribe` invoked — transcription is server-side and non-blocking to the UI (NFR-02)
5. `TranscriptionServiceFactory.create()` returns the configured provider (NFR-03 Factory Method)
6. `withRetry()` attempts up to 3 calls to Sarvam AI with 1s → 2s linear backoff (NFR-05)
7. On success: session advances to `TRANSCRIBED`; pipeline continues to entity extraction
8. On total failure: session stays in `RECORDED`; `audioUrl` preserved; error surfaced to UI; no data lost

**NFR-05 reliability:** Even if note generation fails after a successful transcription, the transcript is already saved. The session can be retried from `RECORDED`.

---

## 6. Deployment Diagram

**File:** `6.Deployment_Diagram.puml`

Shows both the local development and production deployment targets.

**Development:**
- Next.js dev server on `localhost:3000`
- Spring Boot on `localhost:8080` with DevTools auto-restart
- All secrets in `.env.local`

**Production:**
- **Vercel** — Next.js serverless functions on a global CDN; API routes deployed as lambdas; static assets edge-cached
- **Cloud VM / Container** — Spring Boot JAR behind a TLS-terminating load balancer
- **Supabase Cloud** — managed PostgreSQL with HA, row-level security, Storage, and Realtime

**NFR-01:** TLS enforced at all network hops in production. No plaintext paths.
**NFR-02:** Vercel serverless cold starts < 200ms for CRUD; static assets from CDN edge.
**NFR-05:** Supabase manages backups and HA; Spring Boot runs behind a load balancer with health checks.

---

## 7. Data Model Diagram

**File:** `7.Data_Model_Diagram.puml`

Documents all persistent entities and their relationships.

| Entity | Storage | Purpose |
|--------|---------|---------|
| `profiles` | Supabase (PostgreSQL) | Doctor and admin accounts, role, JWT identity |
| `patients` | Supabase (PostgreSQL) | Patient demographics and medical history (JSONB) |
| `sessions` | Supabase (PostgreSQL) | Clinical sessions, status, transcription, SOAP, entities |
| `SoapNote` | JSONB column on `sessions` | Structured SOAP fields — base + specialty-specific |
| `MedicalEntities` | JSONB column on `sessions` | Extracted symptoms, diagnoses, medications, allergies, vitals |
| `audit_logs` | Supabase (PostgreSQL) | Append-only immutable action log |
| `prescription_templates` | Supabase (PostgreSQL + Storage) | Doctor letterhead image + safe-zone config |

**NFR-04:** `audit_logs` is append-only — no `UPDATE` or `DELETE` is ever issued. Accessible only via `AdminFacade` with `ADMIN` role.
**JSONB design:** `soap` and `entities` are stored as PostgreSQL JSONB — schema-flexible (supports all 6 specialty templates), indexed, and queryable.

---

## 8. Factory Method Pattern — TranscriptionServiceFactory

**File:** `8.Factory_Method_Pattern.puml`

**Pattern:** Factory Method (GoF Creational)
**Location:** `frontend/lib/transcription-factory.ts`
**NFR:** NFR-03 Extensibility

The Factory Method pattern decouples the AI Pipeline from any specific transcription vendor. The `TranscriptionProvider` interface is the product contract. `SarvamTranscriptionProvider` is the current concrete product. `TranscriptionServiceFactory.create()` reads `TRANSCRIPTION_PROVIDER` from the environment and instantiates the correct provider.

**Extension rule:** To add Whisper or Google STT:
1. Implement `TranscriptionProvider`
2. Add a `case` in `TranscriptionServiceFactory.create()`
3. Set `TRANSCRIPTION_PROVIDER=whisper` in the environment

No API routes, no calling code, and no other classes require modification.

---

## 9. Template Method Pattern — SoapNoteGenerator

**File:** `9.Template_Method_Pattern.puml`

**Pattern:** Template Method (GoF Behavioral)
**Location:** `frontend/lib/soap-note-generator.ts`
**NFR:** NFR-03 Extensibility

`SoapNoteGenerator` defines the fixed algorithm skeleton:
1. `specialtyContext()` — hook; subclass injects specialty-aware prompt suffix
2. `callModel()` — invariant; builds the Claude prompt, calls `claude-sonnet-4-6`, parses the response
3. `normaliseFields()` — invariant; ensures every declared field key is present in the result

Six concrete subclasses (GeneralOPD, MentalHealth, Physiotherapy, Pediatric, Cardiology, SurgicalFollowup) override only `templateName`, `fields`, and optionally `specialtyContext()`.

**Extension rule:** To add Dermatology or Ophthalmology:
1. Extend `SoapNoteGenerator`
2. Declare `templateName`, `fields`, and override `specialtyContext()`
3. Add instance to `GENERATORS` array in `NoteGeneratorFactory`

The `POST /api/generate-note` route is never modified.

---

## 10. Observer Pattern — ConsultationEventPublisher

**File:** `10.Observer_Pattern.puml`

**Pattern:** Observer (GoF Behavioral)
**Location:** `backend/java/…/lifecycle/observer/`
**FRs:** FR-12 (automatic notifications) · **NFRs:** NFR-04 (audit on every transition)

`ConsultationEventPublisher` is the subject. It holds a list of `ConsultationObserver` instances and calls `onEvent(ConsultationEvent)` on each when a session transitions state.

**Concrete observers:**
| Observer | Responsibility |
|----------|---------------|
| `AuditLoggerObserver` | Maps `toStatus` → audit action; writes to `audit_logs` via `AuditService` |
| `DoctorNotifierObserver` | Logs INFO-level notifications for `UNDER_REVIEW`, `APPROVED`, `REJECTED` |
| `SessionStatusObserver` | Logs all lifecycle transitions for debugging |

**Extension rule:** To add an SMS dispatcher or push notification sender, implement `ConsultationObserver`, annotate with `@Component`, and Spring auto-wires it. `SessionServiceImpl` and existing observers are untouched.

---

## 11. State Pattern — Consultation Lifecycle

**File:** `11.State_Pattern.puml`

**Pattern:** State (GoF Behavioral)
**Locations:** `backend/java/…/lifecycle/state/` · `frontend/lib/session-state-machine.ts`
**FRs:** FR-11 (illegal transitions blocked) · **NFRs:** NFR-04, NFR-05

The consultation lifecycle is modelled as a state machine with 7 states:

```
SCHEDULED → IN_PROGRESS → RECORDED → TRANSCRIBED → UNDER_REVIEW → APPROVED (terminal)
                                                               ↘ REJECTED → UNDER_REVIEW
```

**Java side:** `ConsultationState` interface; each concrete state class (`ScheduledState`, `InProgressState`, etc.) declares its allowed transitions and throws `IllegalStateTransitionException` on invalid ones. `ConsultationStateFactory` hydrates the correct state object from the persisted status string.

**TypeScript mirror:** `VALID_TRANSITIONS` map + `assertTransition()` enforces the same rules client-side in `ScribeStore` before any API call, preventing illegal UI-driven transitions.

**Key invariants:**
- `APPROVED` is terminal — `transitionTo()` always throws. Notes are permanently locked.
- `REJECTED → UNDER_REVIEW` is the only regeneration path.
- Every successful `transitionSession()` call fires `ConsultationEventPublisher.publish()`, which triggers the audit log observer (NFR-04).

```

---

### `docs/Requirements_&_Subsystems/Context and Event flow Diagrams/System_Context_Diagram.puml`

```plantuml
@startuml System_Context_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam arrowColor #444444
skinparam actorBorderColor #333333
skinparam rectangleBorderColor #555555
skinparam rectangleBackgroundColor #FFFFFF
skinparam cloudBorderColor #888888
skinparam databaseBorderColor #888888
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFFEE

title ScribeHealth AI — System Context Diagram

actor "Doctor" as Doctor #LightSteelBlue
actor "Administrator" as Admin #LightSalmon
actor "Patient" as Patient #PaleGreen

rectangle "ScribeHealth AI\n(System Boundary)" as System #LightYellow

database "Supabase\n(PostgreSQL + Storage)" as DB #D5F5E3
cloud "Sarvam AI\nsaarika:v2.5" as Sarvam #FFFACD
cloud "Anthropic Claude\nHaiku + Sonnet" as Claude #FFF3E0
cloud "Email / WhatsApp / SMS\n(Sharing Channels)" as Notify #E8F5E9
cloud "Supabase Auth\n(Identity + JWT)" as SupaAuth #F3E5F5

Doctor -right-> System : "login, record consultation,\nreview & approve notes"
Admin -right-> System : "manage users,\nview audit logs"
System -right-> Patient : "receive approved\nnotes / prescriptions"

System -down-> DB : "JPA/Hibernate + Supabase client\n(patients, sessions, audit_logs)"
System -down-> Sarvam : "POST audio buffer\nspeech-to-text"
System -down-> Claude : "SOAP generation\nentity extraction"
System -down-> SupaAuth : "signIn / signOut\nJWT validation"
System -down-> Notify : "mailto: / wa.me: / sms:\nnote & prescription sharing"

note right of System
  Layered + Event-Driven Architecture
  8 subsystems · 7 design patterns
  FR-01 to FR-12 | NFR-01 to NFR-05
end note

@enduml

```

---

### `docs/Requirements_&_Subsystems/Context and Event flow Diagrams/Strategic Domain Event Flow.puml`

```plantuml
@startuml Strategic_Domain_Event_Flow
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceLifeLineBorderColor #888
skinparam sequenceParticipantBorderColor #555
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFFF0
hide footbox

title ScribeHealth AI — Strategic Domain Event Flow

actor       "Doctor"         as D
participant "Frontend"       as FE
participant "Spring Boot"    as BE
participant "Supabase DB"    as DB
participant "Sarvam AI"      as SAR
participant "Claude"         as CL
participant "Notify Channel" as NTF

== Auth Phase (FR-01 / NFR-01) ==

D -> FE : Enter credentials
FE -> BE : POST /api/auth/login
BE -> DB : findByEmail + verifyPassword
DB --> BE : User {role, isActive}
BE -> BE : JwtUtil.generateToken()
BE --> FE : AuthResponse {JWT, role}
FE -> DB : <<audit>> login_success
note right of DB : JWT expires in 8 hrs\nNFR-01 security

== Session Creation (FR-03 / FR-11) ==

D -> FE : Select patient → New Session
FE -> BE : POST /api/sessions
BE -> DB : INSERT sessions {status=SCHEDULED}
DB --> BE : ClinicalSession {id}
BE --> FE : session created
FE -> DB : <<audit>> session_created

== Audio Recording (FR-03) ==

D -> FE : Start Recording
FE -> FE : assertTransition(SCHEDULED→IN_PROGRESS)
FE -> DB : UPDATE sessions {status=IN_PROGRESS}
D -> FE : Stop Recording
FE -> FE : assertTransition(IN_PROGRESS→RECORDED)
FE -> DB : UPDATE sessions {status=RECORDED, audioUrl}
note right of FE : Audio stored in\nSupabase Storage

== AI Pipeline (FR-04 / FR-05 / FR-06 / NFR-02 / NFR-03) ==

FE -> SAR : POST /api/transcribe\n(audio buffer)
activate SAR
note right of SAR : Factory Method:\nSarvamTranscriptionProvider\nwithRetry() x3 (NFR-05)
SAR --> FE : transcript : String
deactivate SAR
FE -> DB : UPDATE sessions {status=TRANSCRIBED, transcription}

FE -> CL : POST /api/extract-entities\n(transcript)
activate CL
CL --> FE : MedicalEntities JSON
deactivate CL
FE -> DB : UPDATE sessions {entities}

FE -> CL : POST /api/generate-note\n(transcript, template)
activate CL
note right of CL : Template Method:\nNoteGeneratorFactory\nClaude Sonnet (NFR-03)
CL --> FE : SoapNote {s, o, a, p}
deactivate CL
FE -> FE : assertTransition(TRANSCRIBED→UNDER_REVIEW)
FE -> DB : UPDATE sessions {status=UNDER_REVIEW, soap}

== Observer Notifications (FR-12 / NFR-04) ==

BE -> BE : ConsultationEventPublisher.publish()
note right of BE : AuditLoggerObserver → note_ready\nDoctorNotifierObserver → INFO\nSessionStatusObserver → log
FE -> DB : <<audit>> note_ready

== Review Phase (FR-08 / NFR-01) ==

D -> FE : Review note, edit fields
FE -> DB : UPDATE sessions {edits, soap}
FE -> DB : <<audit>> note_edited

alt Doctor Approves
  D -> FE : Click Approve
  FE -> FE : assertTransition(UNDER_REVIEW→APPROVED)
  FE -> BE : PATCH /api/sessions/{id}/transition
  BE -> DB : UPDATE sessions {status=APPROVED}
  BE -> DB : <<audit>> note_approved
  note right of DB : APPROVED is terminal\nNote locked permanently
else Doctor Rejects
  D -> FE : Click Reject
  FE -> FE : assertTransition(UNDER_REVIEW→REJECTED)
  FE -> BE : PATCH /api/sessions/{id}/transition
  BE -> DB : UPDATE sessions {status=REJECTED}
  BE -> DB : <<audit>> note_rejected
  note right of FE : REJECTED→UNDER_REVIEW\nregeneration path
end

== Sharing (FR-09) ==

D -> FE : Share approved note
FE -> NTF : noteSharingTemplate() → mailto:/wa.me:/sms:
note right of NTF : Email / WhatsApp / SMS\nFR-09 channels

== Admin Audit Trail (FR-02 / FR-10 / NFR-04) ==

note over DB : All actions write append-only rows to audit_logs.\nAdmin views via AdminFacade /api/admin/audit-logs (ADMIN role only).

@enduml

```

---

## How to commit

```bash
# For each commit group, create the files, then:
git add <files>
git commit -m "<message from table above>"

# After all 10 commits:
git push origin main
```
