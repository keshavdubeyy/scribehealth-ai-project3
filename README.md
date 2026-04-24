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
