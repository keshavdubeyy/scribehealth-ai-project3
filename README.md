# ScribeHealth AI

An AI-powered medical scribe system that automates clinical documentation from doctor-patient consultations. Records audio, transcribes speech, extracts medical entities, generates structured SOAP notes, and manages the full review-approval workflow.

---

## Overview

ScribeHealth AI reduces the administrative burden on healthcare providers by:

- **Recording consultations** with start, stop, pause, and resume controls
- **Transcribing audio** asynchronously using Sarvam AI (Hindi/English support)
- **Extracting medical entities** (symptoms, diagnoses, medications, allergies, vitals) with Claude Haiku
- **Generating structured SOAP notes** tailored to 6 medical specialties
- **Enabling doctor review** with edit, approve, or reject workflows
- **Sharing approved notes** via Email, WhatsApp, or SMS
- **Maintaining immutable audit logs** of every system action

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React 19, Tailwind CSS 4, Zustand) |
| Backend | Java 17 / Spring Boot 3.2 |
| Database | PostgreSQL (via Supabase) |
| Authentication | JWT (Java JJWT + NextAuth 5) |
| Transcription | Sarvam AI `saarika:v2.5` |
| NLP & Note Generation | Anthropic Claude (Haiku + Sonnet) |
| Storage | Supabase Storage |

---

## Architecture

The system follows a **Layered + Event-Driven** architecture:

- **Frontend**: Next.js App Router with server-side API routes
- **Backend**: Spring Boot REST API with JPA/Hibernate
- **AI Pipeline**: Async processing — audio capture → transcription → entity extraction → SOAP generation
- **State Management**: Zustand (frontend) + PostgreSQL (backend)
- **Notifications**: Observer-driven lifecycle events

See `docs/architecture.puml` for detailed diagrams.

---

## Functional Requirements

| ID | Requirement | Status |
|---|---|:---:|
| FR-01 | Doctors can register, log in, and manage only their own patients and consultations | ✅ |
| FR-02 | Administrators can manage users (create, activate, deactivate) and view audit logs | ✅ |
| FR-03 | The system records doctor-patient audio with start, stop, pause, and resume controls | ✅ |
| FR-04 | Audio is transcribed asynchronously; failed transcriptions are retried automatically | ✅ |
| FR-05 | Transcripts are processed to extract symptoms, diagnoses, medications, allergies, vitals, and treatment plans | ✅ |
| FR-06 | Extracted entities are assembled into a structured SOAP note pre-filled for doctor review | ✅ |
| FR-07 | Doctors can select from specialty templates (General OPD, Cardiology, Pediatric, etc.) | ✅ |
| FR-08 | Doctors review, edit, approve, or reject AI-generated notes before permanent record storage | ✅ |
| FR-09 | Approved notes can be shared via Email, SMS, or WhatsApp | ✅ |
| FR-10 | Every system action (login, note approval, sharing) is logged with actor, timestamp, and entity | ✅ |
| FR-11 | Consultation state transitions are enforced; illegal transitions are blocked | ✅ |
| FR-12 | Stakeholders are notified automatically on lifecycle events (note ready, approved, failure) | ✅ |

> - **FR-02** — Admins can manage users via the `/api/admin/users` portal, including direct creation of new doctor accounts, generating multi-use invite codes, and toggling activation/deactivation; Audit log UI is fully built and displays live system events with sub-second latency via Supabase Realtime; `login_success` and `logout` events are automatically captured through NextAuth middleware.
> - **FR-05** — Claude Haiku extracts 6 typed entity categories (symptoms, diagnoses, medications, allergies, vitals, treatment plans) via `/api/extract-entities`; stored as `entities JSONB` on session; displayed in dedicated **Entities tab** in the session view; re-extractable on demand
> - **FR-09** — `prescription-tab.tsx` has a "Share prescription" dropdown that generates the PDF (via `/api/prescriptions/generate`) then opens Email (`mailto:`), WhatsApp (`wa.me/`), or SMS (`sms:`) with pre-filled prescription content; sharing available whenever the patient has an email or phone on record; `prescriptionSharingTemplate()` and `noteSharingTemplate()` defined in `lib/notifications.ts`
> - **FR-10** — All system actions logged: `login_success`, `logout` (via NextAuth signIn/signOut → `logAuditServer`), `patient_created`, `patient_updated`, `patient_deleted`, `session_created`, `session_deleted`, `note_edited`, `note_approved`, `note_rejected`, `note_generated`, `note_regenerated`, `notification_sent` (via `/api/notify`)
> - **FR-11** — `lib/session-state-machine.ts` defines `VALID_TRANSITIONS` map + `assertTransition()` which throws on illegal jumps; `transitionSession()` in the store validates every status change before writing; `APPROVED` is terminal (no further transitions); `REJECTED → UNDER_REVIEW` is the only regeneration path; sessions now start in `SCHEDULED` and advance through the full 7-state chain

---

## Non-Functional Requirements

| ID | Requirement | Architectural Significance | Status |
|---|---|---|:---:|
| NFR-01 | **Security** — PHI data must be encrypted in transit (TLS) and at rest; JWT tokens expire in 8 hours | Drives auth filter chain, HTTPS enforcement, token expiry config | ✅ |
| NFR-02 | **Performance** — Transcription pipeline must not block the UI; API responses under 500ms for CRUD | Drives async processing, non-blocking transcription handoff | ✅ |
| NFR-03 | **Extensibility** — New transcription providers or templates added without modifying core logic | Drives Factory Method and Template Method patterns | ✅ |
| NFR-04 | **Auditability** — All actions traceable; logs immutable and admin-only | Drives AuditLog collection, Facade pattern, role-based access | ✅ |
| NFR-05 | **Reliability** — Transcription failures recovered via retry; no data loss on pipeline error | Drives retry mechanism, session status persistence | ✅ |

> - **NFR-01** — Supabase enforces TLS; NextAuth JWT with configurable expiry; all data encrypted at rest
> - **NFR-02** — Transcription runs server-side async; CRUD under 500ms via Supabase direct queries
> - **NFR-03** — Fully extensible on both axes: (1) transcription providers via `TranscriptionServiceFactory` (`TranscriptionProvider` interface + `SarvamTranscriptionProvider` — swap to Whisper/Google STT with one new class + one env var change); (2) SOAP note templates via `SoapNoteGenerator` Template Method (new specialty = new subclass only)
> - **NFR-04** — Global append-only `audit_logs` table; all key actions logged with actor + timestamp + entity; admin view built
> - **NFR-05** — `withRetry()` wrapper retries transcription up to 3 times (1s → 2s backoff); transcript saved even if note generation fails

---

## System Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js (React 19, Tailwind CSS, Zustand) |
| Backend | Java 17 / Spring Boot 3.2 |
| Transcription | Sarvam AI `saarika:v2.5` (Hindi/English speech-to-text) |
| NLP & Note Generation | Anthropic Claude — Haiku (template detection) + Sonnet (SOAP generation) |
| Database | Supabase (PostgreSQL + Storage) |
| Communication | External APIs — Email, SMS, WhatsApp |

### Subsystems

| Subsystem | Role | Status |
|---|---|:---:|
| **Auth & Access** | JWT login/register, role enforcement, session management | ✅ |
| **Patient & Session** | CRUD for patient records and clinical sessions; SOAP note storage | ✅ |
| **AI Pipeline** | Audio capture → async transcription → NLP extraction → SOAP note generation | ✅ |
| **Review & Sharing** | Doctor approval workflow; multi-channel note distribution | ✅ |
| **Audit & Admin** | Immutable action logging; admin dashboard with audit log view | ✅ |
| **Lifecycle & Notifications** | State machine for consultation stages; Observer-driven multi-channel stakeholder alerts | ✅ |
| **Profile Builder** | Validated construction of complex patient profiles | ✅ |
| **Prescription Generator** | AI auto-fill prescription, canvas template setup, PDF generation | ✅ |

### Architectural Tactics

| Tactic | NFR Addressed | How |
|---|---|---|
| **Separation of Concerns** | NFR-03 Extensibility | Each pipeline stage (recording, transcription, NLP, generation) is an isolated module with a defined interface |
| **Extensibility through Interfaces** | NFR-03 Extensibility | Factory Method and Template Method patterns mean new providers/templates require only a new implementing class |
| **Async Transcription with Retry** | NFR-02 Performance, NFR-05 Reliability | Transcription runs off the request thread; `withRetry()` retries up to 3× with linear backoff on failure |
| **Human-in-the-loop Verification** | NFR-01 Security, NFR-04 Auditability | No AI output enters permanent records without explicit doctor Approve action; notes are locked on approval |
| **Immutable Audit Logging** | NFR-04 Auditability | Every state-changing action appends to `audit_logs` table; accessible via admin-only `/dashboard/audit-log` |

---

## Key Features

### For Doctors
- Secure JWT login with role-based access
- Patient and consultation management
- Real-time audio recording with pause/resume
- AI-generated specialty-specific SOAP notes (General OPD, Cardiology, Pediatric, Mental Health, Physiotherapy, Surgical Follow-up)
- Field-by-field note editing with audit trail
- Approve/reject workflow with regeneration
- Prescription generation and sharing

### For Administrators
- User management (create, activate, deactivate doctor accounts)
- Invite code generation for onboarding
- Real-time audit log dashboard
- System statistics and analytics

### Security & Compliance
- PHI encrypted in transit (TLS) and at rest
- JWT tokens with 8-hour expiry
- Cross-doctor data isolation via `user_email` scoping
- Immutable append-only audit logging
- Admin-only access to audit logs and user management

---

## Design Patterns

The system implements 6 formal design patterns for modularity and extensibility:

| Pattern | Location | Purpose |
|---|---|---|
| **Service Layer** | Java `service/` | Separates business logic from controllers |
| **Factory Method** | TypeScript `lib/transcription-factory.ts` | Dynamic transcription provider selection |
| **Template Method** | TypeScript `lib/soap-note-generator.ts` | Specialty-aware SOAP note generation |
| **Facade** | Java `facade/AdminFacade.java` | Unified admin operations entry-point |
| **State** | Java `lifecycle/state/` | Consultation lifecycle transition enforcement |
| **Observer** | Java `lifecycle/observer/` | Event-driven notifications on state changes |
| **Builder** | Java `builder/PatientProfileBuilder.java` | Validated patient profile construction |

> **What's implemented vs required:** The course requires at least **5 design patterns** formally implemented. Currently **6 patterns are fully implemented and integrated into running code**: Service Layer (`UserService`/`AuditService` interfaces + implementations), Factory Method (`TranscriptionServiceFactory` + `NoteGeneratorFactory`), Template Method (`SoapNoteGenerator` hierarchy), Facade (`AdminFacade`), State (`ConsultationState` + 7 concrete states), Observer (`ConsultationEventPublisher` + 3 observers), and Builder (`PatientProfileBuilder` with validation).

---

## Project Structure

```
scribehealth-ai-project3/
├── frontend/              # Next.js application
│   ├── app/               # App Router (pages, API routes)
│   ├── components/        # React components
│   ├── lib/               # Core TypeScript utilities
│   └── supabase/          # Database schema
├── backend/java/          # Spring Boot backend
│   └── src/main/java/com/scribehealth/
│       ├── controller/    # REST controllers
│       ├── service/       # Service Layer
│       ├── model/         # JPA entities
│       ├── repository/    # Spring Data JPA
│       ├── facade/        # Facade pattern
│       ├── lifecycle/     # State + Observer patterns
│       └── builder/       # Builder pattern
└── docs/                  # Documentation and diagrams
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Java 17+
- Maven (or use `./mvnw`)
- Supabase account

### 1. Database Setup

Run `frontend/supabase/schema.sql` in your Supabase SQL Editor, then:
- Create a **public** Storage bucket named `sessions`
- Create a **public** Storage bucket named `prescription-templates`

### 2. Backend (Spring Boot)

```bash
cd backend/java
./mvnw spring-boot:run
```

- Runs on **Port 8081**
- API Base: `http://localhost:8081/api`
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Runs on **Port 3000**
- Web: [http://localhost:3000](http://localhost:3000)

### Environment Variables

See `frontend/.env.local.example` for required keys:
- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SARVAM_API_KEY`
- `ANTHROPIC_API_KEY`
- `AUTH_SECRET`

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | JWT login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | Logout |
| `/api/patients` | GET/POST | List / create patients |
| `/api/sessions` | GET/POST | List / create sessions |
| `/api/sessions/{id}/transition` | PATCH | State transition |
| `/api/admin/users` | GET/POST | Admin user management |
| `/api/admin/audit-logs` | GET | Audit log pagination |
| `/api/notify` | POST | System notification |

---

## License

Academic project — CS6.401 Software Engineering, Spring 2026.
