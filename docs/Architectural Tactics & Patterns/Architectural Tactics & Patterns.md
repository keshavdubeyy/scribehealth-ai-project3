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
