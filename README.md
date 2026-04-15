---
layout: page
title: Project 3
permalink: /projects/project-3
parent: Projects
nav_order: 3
---

# CS6.401 Software Engineering
## Spring 2026

## Project 3 — AI-Powered Medical Scribe System

A team of **five members** will build a modular, extensible system that covers:
- Consultation recording and transcription
- Clinical note generation from transcripts (SOAP format)
- Doctor review and approval of notes

The system must integrate **at least five design patterns** (Strategy, Factory Method, Template 
Method, Service Layer, Facade) with strongly backed justifications. Keep the architecture modular, 
maintainable, and extensible.

---

## System Architecture

The system is built using the following tech stack:

| Layer | Technology |
|---|---|
| Frontend | Web or Mobile Interface |
| Backend | Java / Spring Boot |
| Transcription | Speech-to-Text Engine (external API) |
| NLP | Medical Entity Extraction Module |
| Database | Relational DB (users, patients, consultations, notes) |
| Communication | External APIs — Email, SMS, WhatsApp |

### Architectural Tactics

- **Separation of Concerns** — each module (recording, transcription, NLP, note gen) is independently isolated
- **Extensibility through Interfaces** — new transcription providers or sharing channels can be added without modifying core logic
- **Retry Mechanisms** — for transcription or delivery failures
- **Human-in-the-loop verification** — doctor must review and approve all generated notes
- **Audit Logging** — all system actions are recorded for traceability and governance

---

## Features & Tasks

---

### 1. User Authentication & Role-Based Access

*A doctor shouldn't be seeing another doctor's patients. An admin shouldn't be creating 
consultation records. Access control is non-negotiable in healthcare.*

Implement secure login and account management for two roles:
- **Doctors**: can manage their own consultations, review notes, and approve documentation.
- **Administrators**: can manage users, configure templates, and view system audit logs.

**Design Pattern Required:** Service Layer Pattern — separating business logic from the UI and 
domain entities.

---

### 2. Patient & Consultation Management

*Every consultation must be traceable. Every patient must have a continuous, accurate medical 
history.*

The system must store and manage:
- Patient records (name, history, past consultations)
- Consultation records (date, doctor, linked patient, status)
- Clinical notes attached to each consultation

Consultation is the **central domain entity** of the entire system. All features revolve around it.

---

### 3. Consultation Recording

*The doctor presses record. Everything else should be automatic.*

Doctors can record doctor–patient conversations during consultations. The recording module must 
support:
- Start, Stop, Pause, and Resume controls
- Audio stored temporarily for transcription
- Clean handoff to the transcription pipeline after recording ends

---

### 4. Speech-to-Text Transcription

*Turning spoken words into structured text is the first technical bottleneck. Handle it 
gracefully.*

Audio recordings are passed to a **Speech-to-Text Engine** that converts them into text 
transcripts. Requirements:
- Transcription must happen asynchronously (do not block the UI)
- Implement **retry mechanisms** for failed transcriptions
- The transcript is the mandatory input to the NLP and Note Generation stages

**Design Pattern Required:** Factory Method Pattern — dynamically creating transcription service 
instances or communication channel handlers.

---

### 5. Medical Entity Extraction (NLP)

*A transcript alone is not a medical note. You need to pull out what matters: symptoms, diagnoses, 
medications, allergies, vitals, and treatment plans.*

An NLP module processes the transcript and extracts structured medical entities:
- Symptoms and chief complaints
- Diagnoses and clinical observations
- Medications and dosages
- Allergies
- Vitals (if mentioned verbally)
- Treatment plans and follow-up instructions

This extracted data feeds directly into clinical note generation. You are free to use rule-based 
extraction, pre-trained NLP models, or LLM-based extraction — justify your choice.

---

### 6. Clinical Note Generation

*The extracted entities need to be assembled into a structured, doctor-readable note. SOAP format 
is your target.*

Generate structured clinical notes using the **SOAP format**:
- **S**ubjective — what the patient reports
- **O**bjective — clinical observations and vitals
- **A**ssessment — diagnosis or differential diagnosis
- **P**lan — treatment plan, medications, and follow-up

Notes must be generated **before the doctor sees them** and must be editable before final approval.

**Design Pattern Required:** Template Method Pattern — defines the note generation structure 
(SOAP skeleton) while allowing customization at each step.


---

### 7. Template-Based Documentation

*Not every doctor documents the same way. A cardiologist's note looks different from a GP's.*

Doctors should be able to:
- Choose from predefined documentation templates
- Create and save custom templates
- Associate templates with specific consultation types

Administrators manage the global template library.

**Design Pattern Required:** Factory Method Pattern (shared with note creation) — dynamically 
instantiating the correct template type.

---

### 8. Review & Approval Workflow

*No AI output should enter a patient's permanent medical record without a doctor's eyes on it.*

After a note is generated, it enters a **review pipeline**:
1. Doctor is notified that a note is ready for review
2. Doctor reads, edits if necessary, and approves the note
3. Approved note is saved permanently to the patient's record
4. Rejected notes are flagged and can be regenerated

This is the **human-in-the-loop** checkpoint of the entire system.

---

### 9. Note Sharing

*A consultation note sometimes needs to go to a specialist, a pharmacy, or the patient 
themselves.*

Approved clinical notes can be shared via:
- **Email**
- **SMS**
- **WhatsApp**

The system must be designed so that new sharing channels (e.g., Slack, MS Teams) can be added 
**without modifying existing channel logic**.

**Design Pattern Required:** Strategy Pattern — interchangeable sharing channels behind a common 
interface.

---

### 10. Audit Logging & Admin Dashboard

*In healthcare, every action leaves a paper trail. Your system is no different.*

All system actions must be logged:
- Who performed the action, when, and on what entity
- Logs must be accessible only by administrators

The **Admin Dashboard** provides a centralized view for:
- User management (create, disable, assign roles)
- Template management
- Viewing and filtering audit logs

**Design Pattern Required:** Facade Pattern — simplifies the UI's interaction with multiple 
internal services (user service, template service, audit service).

---

## Task Distribution — Team 35

The following distribution is suggested based on the feature groupings above. Each member owns 
their modules end-to-end: design, implementation, testing, and documentation.

| Member | Assigned Features | Design Patterns Owned |
|---|---|---|
| **Member 1** | User Authentication, Role-Based Access, Audit Logging, Admin Dashboard | Service Layer Pattern, Facade Pattern |
| **Member 2** | Patient & Consultation Management, Review & Approval Workflow | — (integration-heavy, coordinates with all members) |
| **Member 3** | Consultation Recording, Speech-to-Text Transcription | Factory Method Pattern (transcription services) |
| **Member 4** | Medical Entity Extraction (NLP), Clinical Note Generation | Template Method Pattern |
| **Member 5** | Template-Based Documentation, Note Sharing (Email/SMS/WhatsApp) | Strategy Pattern, Factory Method Pattern (templates) |

> **Note:** Members 3 and 4 must tightly coordinate on the **transcription → entity extraction → 
> note generation pipeline**. Member 2 coordinates integration across all modules for the 
> consultation workflow.


---

## 🚀 Quick Start: Running the Server

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
*   **API Base:** `http://localhost:8081/api`
*   **Auth Endpoints:** `/api/auth/login`, `/api/auth/register`

### 3. Frontend Execution (Next.js)
The frontend uses Turbopack for high-speed development.
```bash
cd frontend
npm install
npm run dev
```
*   **Web Interface:** [http://localhost:3000](http://localhost:3000)
*   **Environment:** Ensure `.env.local` contains `NEXT_PUBLIC_API_BASE=http://localhost:8081/api`.

### 4. Admin Credentials
Once the server is running, you can use the **Enroll Session** flow to create a Doctor or Admin account and access the restored Analytical Dashboard.

---

## Analysis: Design Pattern Coverage

Looking at the current README, the existing tasks with explicit design pattern anchors are:

| Task | Pattern Assigned |
|---|---|
| User Authentication & Role-Based Access | Service Layer |
| Speech-to-Text Transcription | Factory Method |
| Clinical Note Generation | Template Method |
| Template-Based Documentation | Factory Method (shared) |
| Note Sharing (Email/SMS/WhatsApp) | Strategy |
| Audit Logging & Admin Dashboard | Facade |

Tasks like **Consultation Recording**, **Review & Approval Workflow**, and **Patient & Consultation Management** have no explicit design pattern mandate — they're pure implementation/integration work.

---

## 3 Suggested New Tasks

### Task A — Consultation Lifecycle Manager *(State Pattern)*

*A consultation isn't a static object. It transitions through well-defined stages — and not every action is valid at every stage.*

Model the consultation workflow as an explicit state machine with legal transitions:

```
SCHEDULED → IN_PROGRESS → RECORDED → TRANSCRIBED → UNDER_REVIEW → APPROVED / REJECTED
```

Each state encapsulates what actions are permissible (e.g., you cannot "approve" a note that hasn't been transcribed yet). The **State Pattern** eliminates sprawling `if-else` chains and makes adding new states (e.g., `PENDING_SECOND_OPINION`) trivially safe. In Java, each state is a class implementing a `ConsultationState` interface with methods like `startReview()`, `approve()`, `reject()`.

**Design Pattern:** State Pattern — behavior changes based on the consultation's current stage, with illegal transitions explicitly blocked.

---

### Task B — Event-Driven Notification Hub *(Observer Pattern)*

*The doctor shouldn't have to manually check if a note is ready. The system should tell them.*

Build a notification hub that listens to consultation lifecycle events and broadcasts to relevant subscribers. For example:
- Note ready for review → Doctor receives in-app alert
- Note approved → Patient record updated, audit log written, admin dashboard refreshes
- Transcription failed → Admin is alerted

The **Observer Pattern** decouples the event source (consultation state change) from consumers (email notifier, dashboard updater, audit logger). New subscribers can be added without touching the consultation logic, directly extending the extensibility principle the README already outlines for Note Sharing.

**Design Pattern:** Observer Pattern — consultation acts as the `Subject`; notification channels, dashboard, and logger act as `Observers`.

---

### Task C — Patient Profile Builder *(Builder Pattern)*

*A patient record isn't a single form. It's a complex object assembled from many optional, domain-validated parts.*

Patient profiles in a medical scribe system have deeply nested, optional components — chronic conditions, current medications, allergy history, emergency contacts, insurance details. Constructing these with overloaded constructors or massive setter chains is brittle and error-prone. The **Builder Pattern** enforces step-by-step, validated construction of `PatientProfile` objects, ensuring no partially-initialized records reach the database.

```java
PatientProfile profile = new PatientProfile.Builder("John Doe")
    .withChronicConditions(List.of("Hypertension", "T2 Diabetes"))
    .withAllergies(List.of("Penicillin"))
    .withEmergencyContact("Jane Doe", "+91-9XXXXXXXXX")
    .build(); // validates completeness before returning
```

This is especially important since **Patient & Consultation Management** is the central domain entity — it needs a robust, extensible construction mechanism.

**Design Pattern:** Builder Pattern — complex domain object construction with validation guardrails.

---
