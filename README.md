---
layout: page
title: Project 3
permalink: /projects/project-3
parent: Projects
nav_order: 3
---

# CS6.401 Software Engineering
## Spring 2026

## Project 3 - AI-Powered Medical Scribe System

A team of **five members** will build a modular, extensible system that covers:
- Consultation recording and transcription
- Clinical note generation from transcripts (SOAP format)
- Doctor review and approval of notes

The system must integrate at least **five design patterns** (Strategy, Factory Method, Template Method, Service Layer, Facade) with justifications. The architecture should be modular and maintainable.

---

## Project Completion Tracker

> ✅ = fully done (1.0 pt) &nbsp;|&nbsp; ⚠️ = partial (0.5 pt) &nbsp;|&nbsp; ❌ = not done (0 pt)

| Category | Done | Partial | Not done | Score | Progress |
|---|:---:|:---:|:---:|:---:|---|
| Functional Requirements (12) | 8 | 2 | 2 | **75%** | `███████░░░` |
| Non-Functional Requirements (5) | 4 | 1 | 0 | **90%** | `█████████░` |
| Design Patterns (7) | 0 | 3 | 4 | **21%** | `██░░░░░░░░` |
| **Overall (24 pts)** | **12** | **6** | **6** | **63%** | `██████░░░░` |

> **Scoring:** `(✅ × 1 + ⚠️ × 0.5) / total`  
> **Critical gap:** Design patterns (0/7 fully implemented) is the single biggest drag on overall score.

---

## Requirements

### Functional Requirements

| ID | Requirement | Status |
|---|---|:---:|
| FR-01 | Doctors can register, log in, and manage only their own patients and consultations | ✅ |
| FR-02 | Administrators can manage users (create, activate, deactivate) and view audit logs | ⚠️ |
| FR-03 | The system records doctor-patient audio with start, stop, pause, and resume controls | ✅ |
| FR-04 | Audio is transcribed asynchronously; failed transcriptions are retried automatically | ✅ |
| FR-05 | Transcripts are processed to extract symptoms, diagnoses, medications, allergies, vitals, and treatment plans | ✅ |
| FR-06 | Extracted entities are assembled into a structured SOAP note pre-filled for doctor review | ✅ |
| FR-07 | Doctors can select from specialty templates (General OPD, Cardiology, Pediatric, etc.) | ✅ |
| FR-08 | Doctors review, edit, approve, or reject AI-generated notes before permanent record storage | ✅ |
| FR-09 | Approved notes can be shared via Email, SMS, or WhatsApp | ❌ |
| FR-10 | Every system action (login, note approval, sharing) is logged with actor, timestamp, and entity | ✅ |
| FR-11 | Consultation state transitions are enforced; illegal transitions are blocked | ⚠️ |
| FR-12 | Stakeholders are notified automatically on lifecycle events (note ready, approved, failure) | ❌ |

> **Legend:** ✅ Done &nbsp;|&nbsp; ⚠️ Partial &nbsp;|&nbsp; ❌ Not implemented
>
> - **FR-02** — Admin user management UI done; global audit log built (`audit_logs` table + `/api/audit` + admin view at `/dashboard/audit-log`); login events not yet logged
> - **FR-05** — Claude Haiku extracts 6 typed entity categories (symptoms, diagnoses, medications, allergies, vitals, treatment plans) via `/api/extract-entities`; stored as `entities JSONB` on session; displayed in dedicated **Entities tab** in the session view; re-extractable on demand
> - **FR-10** — All system actions logged: `login_success`, `logout` (via NextAuth events), `patient_created`, `patient_deleted`, `session_created`, `session_deleted`, `note_edited`, `note_approved`, `note_rejected`, `note_generated`, `note_regenerated`; sharing events pending FR-09
> - **FR-11** — Full 7-state lifecycle implemented in code (`SCHEDULED → IN_PROGRESS → RECORDED → TRANSCRIBED → UNDER_REVIEW → APPROVED / REJECTED`); transitions are imperative calls — no formal state-class hierarchy that throws on illegal jumps

### Non-Functional Requirements

| ID | Requirement | Architectural Significance | Status |
|---|---|---|:---:|
| NFR-01 | **Security** — PHI data must be encrypted in transit (TLS) and at rest; JWT tokens expire in 8 hours | Drives auth filter chain, HTTPS enforcement, token expiry config | ✅ |
| NFR-02 | **Performance** — Transcription pipeline must not block the UI; API responses under 500ms for CRUD | Drives async processing, non-blocking transcription handoff | ✅ |
| NFR-03 | **Extensibility** — New transcription providers or sharing channels added without modifying core logic | Drives Factory Method and Strategy patterns | ⚠️ |
| NFR-04 | **Auditability** — All actions traceable; logs immutable and admin-only | Drives AuditLog collection, Facade pattern, role-based access | ✅ |
| NFR-05 | **Reliability** — Transcription failures recovered via retry; no data loss on pipeline error | Drives retry mechanism, session status persistence | ✅ |

> - **NFR-01** — Supabase enforces TLS; NextAuth JWT with configurable expiry; all data encrypted at rest
> - **NFR-02** — Transcription runs server-side async; CRUD under 500ms via Supabase direct queries
> - **NFR-03** — Template extensibility via config map; no formal Factory/Strategy classes for provider swapping yet
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
| **AI Pipeline** | Audio capture → async transcription → NLP extraction → SOAP note generation | ⚠️ |
| **Review & Sharing** | Doctor approval workflow; multi-channel note distribution | ⚠️ |
| **Audit & Admin** | Immutable action logging; admin dashboard with audit log view | ✅ |
| **Lifecycle & Notifications** | State machine for consultation stages; Observer-driven stakeholder alerts | ⚠️ |
| **Profile Builder** | Validated construction of complex patient profiles | ⚠️ |
| **Prescription Generator** | AI auto-fill prescription, canvas template setup, PDF generation | ✅ |

### Architectural Tactics

| Tactic | NFR Addressed | How |
|---|---|---|
| **Separation of Concerns** | NFR-03 Extensibility | Each pipeline stage (recording, transcription, NLP, generation) is an isolated module with a defined interface |
| **Extensibility through Interfaces** | NFR-03 Extensibility | Factory Method and Strategy patterns mean new providers/channels require only a new implementing class |
| **Async Transcription with Retry** | NFR-02 Performance, NFR-05 Reliability | Transcription runs off the request thread; `withRetry()` retries up to 3× with linear backoff on failure |
| **Human-in-the-loop Verification** | NFR-01 Security, NFR-04 Auditability | No AI output enters permanent records without explicit doctor Approve action; notes are locked on approval |
| **Immutable Audit Logging** | NFR-04 Auditability | Every state-changing action appends to `audit_logs` table; accessible via admin-only `/dashboard/audit-log` |

### Architecture Analysis (for report)

The implemented architecture is a **Layered + Event-Driven Microservice** approach (Spring Boot backend + async AI pipeline + Observer-driven notifications). The alternative to compare against is a **Monolithic Synchronous** architecture where transcription and NLP run in-process on the Java thread.

Key trade-offs to quantify:
- **Response time** — async pipeline keeps API response < 500ms vs synchronous blocking (expected 3–15s per transcription)
- **Throughput** — concurrent session processing capacity with async vs single-threaded bottleneck

---

## Features & Tasks

> **Legend:** ✅ Fully implemented &nbsp;|&nbsp; ⚠️ Partially implemented &nbsp;|&nbsp; ❌ Not implemented

---

### 1. User Authentication & Role-Based Access ✅

Access control is critical in healthcare. Doctors should not see other doctors' patients, and admins should not create consultation records.

Implement secure login and account management for two roles:
- **Doctors**: can manage their own consultations, review notes, and approve documentation.
- **Administrators**: can manage users, configure templates, and view system audit logs.

**Design Pattern:** Service Layer Pattern - separates business logic from the UI and domain entities.

**Implementation status:**
- ✅ Login/signup via NextAuth Credentials provider (JWT strategy, delegated to Spring Boot backend)
- ✅ All patient and session queries scoped by `user_email` — cross-doctor data leakage impossible
- ✅ Role stored in JWT token; admin-only routes guarded in layout
- ⚠️ Service Layer conceptually present via Zustand store abstraction; not implemented as formal named `PatientService` / `SessionService` class hierarchy

---

### 2. Patient & Consultation Management ✅

Every consultation must be traceable. Every patient must have a continuous, accurate medical history.

The system stores and manages:
- Patient records (name, history, past consultations)
- Consultation records (date, doctor, linked patient, status)
- Clinical notes attached to each consultation

Consultation is the central domain entity of the entire system.

**Implementation status:**
- ✅ Full CRUD for patients persisted in Supabase (PostgreSQL), scoped by doctor email
- ✅ Sessions created per consultation, linked to patient via foreign key
- ✅ SOAP notes stored as JSONB on the session row; edit history (field, old value, new value, timestamp) stored as JSONB array
- ✅ Audio recordings uploaded to Supabase Storage; public URL stored on session

---

### 3. Template-Based Documentation ✅

Not every doctor documents the same way. A cardiologist's note looks different from a GP's.

Doctors can choose from predefined specialty templates (General OPD, Cardiology, Pediatric, Mental Health, Physiotherapy, Surgical Follow-up). Administrators manage the global template library.

**Design Pattern:** Factory Method Pattern - dynamically instantiates the correct template type based on consultation specialty.

**Implementation status:**
- ✅ 6 specialty templates implemented: `general_opd`, `cardiology`, `pediatric`, `mental_health_soap`, `physiotherapy`, `surgical_followup`
- ✅ Claude Haiku auto-detects the appropriate template from the consultation transcript
- ✅ Each template has its own field schema; note editor adapts to the selected template's fields
- ⚠️ Factory Method conceptually present via the `NOTE_FIELDS` config map; not implemented as explicit `TemplateFactory` / `NoteTemplate` class hierarchy

---

### 4. AI Pipeline — Recording, Transcription, NLP & Note Generation ⚠️

When the doctor stops recording, the system handles everything: audio capture → transcription → entity extraction → structured SOAP note, all without blocking the UI.

This task covers the full end-to-end AI pipeline:

- **Recording** — real `MediaRecorder`/WebRTC audio capture with start, stop, pause, resume; audio blob uploaded to backend on stop
- **Transcription** — audio passed asynchronously to a Speech-to-Text engine; retry on failure; transcript stored against the session
- **NLP Extraction** — transcript processed to extract structured medical entities: symptoms, diagnoses, medications, dosages, allergies, vitals, treatment plans
- **Note Generation** — extracted entities assembled into a SOAP note (Subjective, Objective, Assessment, Plan) and pre-filled in the session editor for doctor review

**Design Patterns:**
- **Factory Method** — `TranscriptionServiceFactory` dynamically creates the correct transcription provider instance (e.g. OpenAI Whisper, Google STT), keeping provider-switching open/closed
- **Template Method** — `SoapNoteGenerator` defines the fixed SOAP skeleton; each specialty subclass overrides only the sections relevant to its domain

**Implementation status:**
- ✅ Real `MediaRecorder` audio capture with start, stop, **pause, and resume** (FR-03)
- ✅ Pause indicator: top bar turns amber, mic dims, timer freezes; resumes on button press
- ✅ Audio uploaded to Supabase Storage; URL stored on session
- ✅ Sarvam AI `saarika:v2.5` transcription via `/api/transcribe`
- ✅ **Auto-retry** — `withRetry()` retries transcription up to 3 times with 1s/2s linear backoff (FR-04)
- ✅ Claude Sonnet note generation via `/api/generate-note` — produces structured SOAP note pre-filled in the editor
- ✅ Pipeline is non-blocking: recording modal shows "Processing…" state while pipeline runs server-side
- ✅ **NLP entity extraction** — Claude Haiku extracts symptoms, diagnoses, medications (with dosage/frequency), allergies (with severity), vitals, and treatment plans into typed `MedicalEntities` object; runs in parallel with note generation; stored in `entities` DB column; shown in dedicated Entities tab
- ❌ `TranscriptionServiceFactory` class not implemented — Sarvam is hardcoded; no provider-swapping abstraction
- ❌ `SoapNoteGenerator` Template Method class hierarchy not implemented — template selection is config-driven, not subclass-driven

---

### 5. Review, Approval & Note Sharing ⚠️

No AI output enters a patient's permanent record without a doctor's review. Once approved, the note can be distributed to the relevant parties.

**Review workflow:**
1. Doctor is notified that a generated note is ready
2. Doctor reads, edits if necessary, and approves or rejects the note
3. Approved notes are saved permanently; rejected notes are flagged for regeneration

**Sharing:** Approved notes can be sent via Email, SMS, or WhatsApp. New channels (e.g. Slack) can be added without touching existing logic.

**Design Pattern:** Strategy Pattern - a common `NoteShareStrategy` interface with interchangeable `EmailShareStrategy`, `SmsShareStrategy`, and `WhatsAppShareStrategy` implementations.

**Implementation status:**
- ✅ Doctor can view and edit any field of the generated note
- ✅ Every field edit logged with old value, new value, and timestamp (edit history tab + global audit log)
- ✅ **Approve note** button locks all fields permanently; green "Approved" banner shown; action written to audit log (FR-08)
- ✅ **Reject note** button flags session as `REJECTED`; red banner shown with **Regenerate note** button (FR-08)
- ✅ Regeneration calls Claude via `/api/generate-note` and returns note to `UNDER_REVIEW` state
- ⚠️ No **notification** to the doctor when a note is ready (session page navigated to directly after pipeline)
- ❌ **Email / SMS / WhatsApp sharing** not implemented
- ❌ `NoteShareStrategy` interface and concrete strategy classes not implemented

---

### 6. Audit Logging & Admin Dashboard ✅

In healthcare, every action leaves a paper trail.

All system actions are logged (who, what entity, when) and are accessible only to administrators. The Admin Dashboard provides a unified view for user management, template management, and audit log browsing/filtering.

**Design Pattern:** Facade Pattern - `AdminFacade` wraps `UserService`, `TemplateService`, and `AuditService` behind a single interface, shielding the UI from internal service complexity.

**Implementation status:**
- ✅ Admin dashboard UI with user management table
- ✅ **Global `audit_logs` table** (Supabase PostgreSQL) — append-only, one row per action with `user_email`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`
- ✅ **`/api/audit` route** — `POST` writes entries (service-role client, bypasses RLS); `GET` fetches with pagination
- ✅ **`/dashboard/audit-log` page** — searchable, colour-coded admin view of all audit entries
- ✅ Events logged: `login_success`, `logout` (NextAuth events → `audit-server.ts`), `patient_created`, `patient_deleted`, `session_created`, `session_deleted`, `note_edited`, `note_approved`, `note_rejected`, `note_generated`, `note_regenerated`
- ⚠️ Sharing events not logged (sharing not implemented — FR-09)
- ❌ `AdminFacade` class not implemented — admin routes call service layer directly

---

### 7. Consultation Lifecycle & Notification Hub ⚠️

A consultation moves through well-defined stages. The system enforces legal transitions and automatically notifies stakeholders at each milestone — no manual polling required.

**Lifecycle state machine:**

```
SCHEDULED -> IN_PROGRESS -> RECORDED -> TRANSCRIBED -> UNDER_REVIEW -> APPROVED / REJECTED
```

Each state class implements a `ConsultationState` interface and explicitly blocks illegal transitions (e.g. cannot approve a note that has not been transcribed).

**Notification events fired on transitions:**
- `TRANSCRIBED` → doctor alerted that note is ready for review
- `APPROVED` → patient record updated, audit log written, dashboard refreshes
- Transcription failure → admin alerted

**Design Patterns:**
- **State Pattern** — each lifecycle stage is a class; illegal transitions throw checked exceptions
- **Observer Pattern** — `ConsultationSubject` broadcasts lifecycle events; `DoctorNotifier`, `AuditLogger`, and `DashboardRefresher` are registered observers

**Implementation status:**
- ✅ **Full 7-state lifecycle** implemented: `SCHEDULED → IN_PROGRESS → RECORDED → TRANSCRIBED → UNDER_REVIEW → APPROVED / REJECTED` — all states stored in DB and reflected in UI (FR-11)
- ✅ Recording modal advances status at each pipeline stage (session created → SCHEDULED, recording starts → IN_PROGRESS, audio saved → RECORDED, transcript ready → TRANSCRIBED, note generated → UNDER_REVIEW)
- ✅ Status badges colour-coded across session list and session detail views for all 7 states
- ✅ `APPROVED` state locks the note; `REJECTED` enables regeneration
- ❌ No `ConsultationState` interface or state classes — transitions are imperative `updateSession({ status })` calls; illegal transitions (e.g. APPROVED → UNDER_REVIEW) not blocked at code level
- ❌ No `ConsultationSubject` / Observer pattern — no event bus; components read store directly
- ❌ No automatic notifications on any lifecycle event (email, push, in-app)

---

### 8. Patient Profile Builder ⚠️

A patient record is not a single form. It is a complex object assembled from many optional, domain-validated parts.

Patient profiles support deeply nested, optional components:
- **Chronic Conditions** - optional list, validated against known ICD codes
- **Allergies** - optional list with severity metadata
- **Emergency Contact** - name and phone, validated at build time
- **Insurance Details** - optional structured block

The builder enforces step-by-step, validated construction so no partially-initialized records reach the database.

**Design Pattern:** Builder Pattern - `PatientProfileBuilder` with fluent API and a terminal `build()` that runs all validations before persisting.

**Implementation status:**
- ✅ Basic patient creation: name, age, gender — persisted to Supabase
- ❌ **Chronic conditions** field not implemented
- ❌ **Allergies** with severity metadata not implemented
- ❌ **Emergency contact** not implemented
- ❌ **Insurance details** not implemented
- ❌ `PatientProfileBuilder` with fluent API and `build()` validation not implemented — patient created with a direct `insert()` call

---

## Design Patterns Summary

| Task | Pattern(s) | Status |
|---|---|:---:|
| User Authentication & Role-Based Access | Service Layer | ⚠️ |
| Template-Based Documentation | Factory Method | ⚠️ |
| AI Pipeline (Transcription + Note Generation) | Factory Method + Template Method | ⚠️ |
| Review, Approval & Note Sharing | Strategy | ❌ |
| Audit Logging & Admin Dashboard | Facade | ❌ |
| Consultation Lifecycle & Notification Hub | State + Observer | ❌ |
| Patient Profile Builder | Builder | ❌ |

> **What's implemented vs required:** The project requires at least **5 design patterns** formally implemented as class/interface hierarchies. Currently **0 patterns** meet that bar — all are conceptually present in the architecture but expressed as config maps, imperative calls, or store abstractions rather than named classes. This is the single most critical gap before submission.

---

## Submission Deliverables (S26CS6.401)

> **Soft Deadline:** 21 April 2026 &nbsp;|&nbsp; **Hard Deadline:** 28 April 2026  
> **Format:** `Project3_<team_number>.pdf` or `.zip` — submitted via Moodle (one member submits)

### Task 1 — Requirements and Subsystems
- [x] Functional and non-functional requirements (with architectural significance explained)
- [x] Subsystem overview — each subsystem's role and functionality

### Task 2 — Architecture Framework
- [ ] Stakeholder identification per IEEE 42010 (stakeholders → concerns → viewpoints → views)
- [ ] 3–4 Architecture Decision Records (ADRs) using the Nygard template

### Task 3 — Architectural Tactics and Patterns
- [x] 4–5 architectural tactics with explanation of which non-functional requirements they address
- [ ] 2 design patterns described with diagrams (UML or C4 model)

### Task 4 — Prototype Implementation and Analysis
- [x] End-to-end non-trivial functionality implemented *(Recording → Sarvam Transcription → Claude SOAP Note → Approve/Reject workflow — fully working)*
- [ ] Architecture analysis: compare implemented architecture against an alternative pattern
- [ ] Quantification of at least 2 non-functional requirements (e.g., response time, throughput)
- [ ] Trade-off discussion

### Final Report
- [ ] Comprehensive technical report (design decisions, architecture, implementation, analysis)
- [ ] Reflections and lessons learned
- [ ] Individual contributions section
- [ ] Link to this GitHub repository

---

## Quick Start: Running the Server

To get the ScribeHealth AI system running locally, follow these steps:

### 1. Database Setup (Supabase)

The system uses **Supabase** (PostgreSQL + Storage) instead of MongoDB.

- Run `frontend/supabase/schema.sql` in your Supabase project's SQL Editor
- Create a **public** Storage bucket named `sessions`
- Create a **public** Storage bucket named `prescription-templates`
- Copy your Supabase URL and keys into `frontend/.env.local`

### 2. Backend Execution (Spring Boot)

The backend handles authentication and is configured to run on **Port 8081**.

```bash
cd backend/java
./mvnw spring-boot:run
```

- **API Base:** `http://localhost:8081/api`
- **Auth Endpoints:** `/api/auth/login`, `/api/auth/register`

### 3. Frontend Execution (Next.js)

The frontend uses Turbopack for high-speed development.

```bash
cd frontend
npm install
npm run dev
```

- **Web Interface:** [http://localhost:3000](http://localhost:3000)
- **Required `.env.local` keys:** `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SARVAM_API_KEY`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`

### 4. Admin Credentials

Once the server is running, use the **Enroll Session** flow to create a Doctor or Admin account and access the dashboard.
