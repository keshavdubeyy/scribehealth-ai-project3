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

## Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Doctors can register, log in, and manage only their own patients and consultations |
| FR-02 | Administrators can manage users (create, activate, deactivate) and view audit logs |
| FR-03 | The system records doctor-patient audio with start, stop, pause, and resume controls |
| FR-04 | Audio is transcribed asynchronously; failed transcriptions are retried automatically |
| FR-05 | Transcripts are processed to extract symptoms, diagnoses, medications, allergies, vitals, and treatment plans |
| FR-06 | Extracted entities are assembled into a structured SOAP note pre-filled for doctor review |
| FR-07 | Doctors can select from specialty templates (General OPD, Cardiology, Pediatric, etc.) |
| FR-08 | Doctors review, edit, approve, or reject AI-generated notes before permanent record storage |
| FR-09 | Approved notes can be shared via Email, SMS, or WhatsApp |
| FR-10 | Every system action (login, note approval, sharing) is logged with actor, timestamp, and entity |
| FR-11 | Consultation state transitions are enforced; illegal transitions are blocked |
| FR-12 | Stakeholders are notified automatically on lifecycle events (note ready, approved, failure) |

### Non-Functional Requirements

| ID | Requirement | Architectural Significance |
|---|---|---|
| NFR-01 | **Security** — PHI data must be encrypted in transit (TLS) and at rest; JWT tokens expire in 8 hours | Drives auth filter chain, HTTPS enforcement, token expiry config |
| NFR-02 | **Performance** — Transcription pipeline must not block the UI; API responses under 500ms for CRUD | Drives async processing, non-blocking transcription handoff |
| NFR-03 | **Extensibility** — New transcription providers or sharing channels added without modifying core logic | Drives Factory Method and Strategy patterns |
| NFR-04 | **Auditability** — All actions traceable; logs immutable and admin-only | Drives AuditLog collection, Facade pattern, role-based access |
| NFR-05 | **Reliability** — Transcription failures recovered via retry; no data loss on pipeline error | Drives retry mechanism, session status persistence |

---

## System Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js (React 19, Tailwind CSS, Zustand) |
| Backend | Java 17 / Spring Boot 3.2 |
| Transcription | OpenAI Whisper (via Python FastAPI service) |
| NLP | GPT-4o + SciSpacy / SciBERT (medical entity extraction) |
| Database | MongoDB (users, patients, sessions, audit logs) |
| Communication | External APIs — Email, SMS, WhatsApp |

### Subsystems

| Subsystem | Role |
|---|---|
| **Auth & Access** | JWT login/register, role enforcement, session management |
| **Patient & Session** | CRUD for patient records and clinical sessions; SOAP note storage |
| **AI Pipeline** | Audio capture → async transcription → NLP extraction → SOAP note generation |
| **Review & Sharing** | Doctor approval workflow; multi-channel note distribution |
| **Audit & Admin** | Immutable action logging; admin dashboard via Facade |
| **Lifecycle & Notifications** | State machine for consultation stages; Observer-driven stakeholder alerts |
| **Profile Builder** | Validated construction of complex patient profiles |

### Architectural Tactics

| Tactic | NFR Addressed | How |
|---|---|---|
| **Separation of Concerns** | NFR-03 Extensibility | Each pipeline stage (recording, transcription, NLP, generation) is an isolated module with a defined interface |
| **Extensibility through Interfaces** | NFR-03 Extensibility | Factory Method and Strategy patterns mean new providers/channels require only a new implementing class |
| **Async Transcription with Retry** | NFR-02 Performance, NFR-05 Reliability | Transcription runs off the request thread; exponential backoff retries on failure |
| **Human-in-the-loop Verification** | NFR-01 Security, NFR-04 Auditability | No AI output enters permanent records without explicit doctor approval |
| **Immutable Audit Logging** | NFR-04 Auditability | Every state-changing action writes an append-only AuditLog entry accessible only to ADMIN role |

### Architecture Analysis (for report)

The implemented architecture is a **Layered + Event-Driven Microservice** approach (Spring Boot backend + async Python AI pipeline + Observer-driven notifications). The alternative to compare against is a **Monolithic Synchronous** architecture where transcription and NLP run in-process on the Java thread.

Key trade-offs to quantify:
- **Response time** — async pipeline keeps API response < 500ms vs synchronous blocking (expected 3–15s per transcription)
- **Throughput** — concurrent session processing capacity with async vs single-threaded bottleneck

---

## Features & Tasks

---

### 1. User Authentication & Role-Based Access ✅

Access control is critical in healthcare. Doctors should not see other doctors' patients, and admins should not create consultation records.

Implement secure login and account management for two roles:
- **Doctors**: can manage their own consultations, review notes, and approve documentation.
- **Administrators**: can manage users, configure templates, and view system audit logs.

**Design Pattern:** Service Layer Pattern - separates business logic from the UI and domain entities.

---

### 2. Patient & Consultation Management ✅

Every consultation must be traceable. Every patient must have a continuous, accurate medical history.

The system stores and manages:
- Patient records (name, history, past consultations)
- Consultation records (date, doctor, linked patient, status)
- Clinical notes attached to each consultation

Consultation is the central domain entity of the entire system.

---

### 3. Template-Based Documentation ✅

Not every doctor documents the same way. A cardiologist's note looks different from a GP's.

Doctors can choose from predefined specialty templates (General OPD, Cardiology, Pediatric, Mental Health, Physiotherapy, Surgical Follow-up). Administrators manage the global template library.

**Design Pattern:** Factory Method Pattern - dynamically instantiates the correct template type based on consultation specialty.

---

### 4. AI Pipeline — Recording, Transcription, NLP & Note Generation

When the doctor stops recording, the system handles everything: audio capture → transcription → entity extraction → structured SOAP note, all without blocking the UI.

This task covers the full end-to-end AI pipeline:

- **Recording** — real `MediaRecorder`/WebRTC audio capture with start, stop, pause, resume; audio blob uploaded to backend on stop
- **Transcription** — audio passed asynchronously to a Speech-to-Text engine; retry on failure; transcript stored against the session
- **NLP Extraction** — transcript processed to extract structured medical entities: symptoms, diagnoses, medications, dosages, allergies, vitals, treatment plans
- **Note Generation** — extracted entities assembled into a SOAP note (Subjective, Objective, Assessment, Plan) and pre-filled in the session editor for doctor review

**Design Patterns:**
- **Factory Method** — `TranscriptionServiceFactory` dynamically creates the correct transcription provider instance (e.g. OpenAI Whisper, Google STT), keeping provider-switching open/closed
- **Template Method** — `SoapNoteGenerator` defines the fixed SOAP skeleton; each specialty subclass overrides only the sections relevant to its domain

---

### 5. Review, Approval & Note Sharing

No AI output enters a patient's permanent record without a doctor's review. Once approved, the note can be distributed to the relevant parties.

**Review workflow:**
1. Doctor is notified that a generated note is ready
2. Doctor reads, edits if necessary, and approves or rejects the note
3. Approved notes are saved permanently; rejected notes are flagged for regeneration

**Sharing:** Approved notes can be sent via Email, SMS, or WhatsApp. New channels (e.g. Slack) can be added without touching existing logic.

**Design Pattern:** Strategy Pattern - a common `NoteShareStrategy` interface with interchangeable `EmailShareStrategy`, `SmsShareStrategy`, and `WhatsAppShareStrategy` implementations.

---

### 6. Audit Logging & Admin Dashboard

In healthcare, every action leaves a paper trail.

All system actions are logged (who, what entity, when) and are accessible only to administrators. The Admin Dashboard provides a unified view for user management, template management, and audit log browsing/filtering.

**Design Pattern:** Facade Pattern - `AdminFacade` wraps `UserService`, `TemplateService`, and `AuditService` behind a single interface, shielding the UI from internal service complexity.

---

### 7. Consultation Lifecycle & Notification Hub

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

---

### 8. Patient Profile Builder

A patient record is not a single form. It is a complex object assembled from many optional, domain-validated parts.

Patient profiles support deeply nested, optional components:
- **Chronic Conditions** - optional list, validated against known ICD codes
- **Allergies** - optional list with severity metadata
- **Emergency Contact** - name and phone, validated at build time
- **Insurance Details** - optional structured block

The builder enforces step-by-step, validated construction so no partially-initialized records reach the database.

**Design Pattern:** Builder Pattern - `PatientProfileBuilder` with fluent API and a terminal `build()` that runs all validations before persisting.

---

## Design Patterns Summary

| Task | Pattern(s) |
|---|---|
| User Authentication & Role-Based Access | Service Layer |
| Template-Based Documentation | Factory Method |
| AI Pipeline (Transcription + Note Generation) | Factory Method + Template Method |
| Review, Approval & Note Sharing | Strategy |
| Audit Logging & Admin Dashboard | Facade |
| Consultation Lifecycle & Notification Hub | State + Observer |
| Patient Profile Builder | Builder |

---

## Submission Deliverables (S26CS6.401)

> **Soft Deadline:** 21 April 2026 &nbsp;|&nbsp; **Hard Deadline:** 28 April 2026  
> **Format:** `Project3_<team_number>.pdf` or `.zip` — submitted via Moodle (one member submits)

### Task 1 — Requirements and Subsystems
- [ ] Functional and non-functional requirements (with architectural significance explained)
- [ ] Subsystem overview — each subsystem's role and functionality

### Task 2 — Architecture Framework
- [ ] Stakeholder identification per IEEE 42010 (stakeholders → concerns → viewpoints → views)
- [ ] 3–4 Architecture Decision Records (ADRs) using the Nygard template

### Task 3 — Architectural Tactics and Patterns
- [ ] 4–5 architectural tactics with explanation of which non-functional requirements they address
- [ ] 2 design patterns described with diagrams (UML or C4 model)

### Task 4 — Prototype Implementation and Analysis
- [ ] At least 1 end-to-end non-trivial functionality implemented and demonstrated *(recommended: Task 4 AI Pipeline — Recording → Transcription → NLP → SOAP Note)*
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

### 1. Database Initialization

Ensure you have **MongoDB** running locally on its default port:
- **Connection String:** `mongodb://localhost:27017/scribehealth`
- The system will automatically create the necessary collections upon first run.

### 2. Backend Execution (Spring Boot)

The backend is configured to run on **Port 8081** to avoid local system conflicts.

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
- **Environment:** Ensure `.env.local` contains `NEXT_PUBLIC_API_BASE=http://localhost:8081/api`.

### 4. Admin Credentials

Once the server is running, you can use the **Enroll Session** flow to create a Doctor or Admin account and access the restored Analytical Dashboard.
