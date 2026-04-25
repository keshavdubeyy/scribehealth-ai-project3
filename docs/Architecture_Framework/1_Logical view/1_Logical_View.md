# Logical View — Bounded Contexts & Event Flows

> **4+1 View: Logical** — Shows how the system is decomposed into bounded contexts (packages) and how domain events flow between them.

---

## Package Diagram — Bounded Contexts

**What this shows:** The system is divided into 8 bounded contexts, each with a clear, non-overlapping responsibility. These are not arbitrary groupings — they map directly to Java packages on the backend (`com.scribehealth.lifecycle`, `com.scribehealth.facade`, etc.) and TypeScript modules on the frontend (`lib/session-state-machine.ts`, `lib/soap-note-generator.ts`).

**Key design decisions visible here:**
- The **Lifecycle Context** is the hub of the event-driven architecture. It sits between the Patient & Session Context (which produces state changes) and both the AI Pipeline and Audit contexts (which consume those state changes). This decouples the pipeline stages from each other.
- The **Auth & Access Context** feeds the Patient & Session Context with a `doctor_email`-scoped access model — no patient or session query runs without this constraint, enforcing FR-01 data isolation.
- The **Profile Builder Context** is isolated because `PatientProfileBuilder` runs complex validation (ICD code format, email regex, phone digit count) that has no dependency on persistence — it is pure construction logic.
- The **Prescription Context** depends only on the Review & Sharing Context (for notification templates), keeping it completely decoupled from the AI Pipeline and Session state machine.

```plantuml
@startuml Logical_Package_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam packageStyle rectangle
skinparam packageBorderColor #555
skinparam classBorderColor #666
skinparam arrowColor #444
skinparam classBackgroundColor #FFFFFF

title ScribeHealth AI — Logical View: Bounded Contexts

package "Auth & Access Context" <<Rectangle>> #EAF4FB {
  class User
  class JwtUtil
  class AuthService
  class DoctorProfileService
  class SecurityConfig
}

package "Patient & Session Context" <<Rectangle>> #EAF7EA {
  class Patient
  class ClinicalSession
  class PatientService
  class SessionService
}

package "AI Pipeline Context" <<Rectangle>> #FFFACD {
  class TranscriptionProvider
  class SarvamTranscriptionProvider
  class SoapNoteGenerator
  class NoteGeneratorFactory
  class MedicalEntities
}

package "Lifecycle Context" <<Rectangle>> #FFF0F5 {
  class ConsultationState
  class ConsultationStateFactory
  class ConsultationEventPublisher
  interface ConsultationObserver
}

package "Audit & Admin Context" <<Rectangle>> #FFF8EE {
  class AuditLog
  class AuditService
  class AdminFacade
  class UserService
}

package "Review & Sharing Context" <<Rectangle>> #F0F0FF {
  class NotificationTemplates
  class SessionStateMachine
}

package "Profile Builder Context" <<Rectangle>> #F5F5F5 {
  class PatientProfileBuilder
}

package "Prescription Context" <<Rectangle>> #F0FFF0 {
  class Prescription
  class PrescriptionTemplate
}

' Cross-context dependencies
"Auth & Access Context"      --> "Patient & Session Context"  : doctor-scoped access
"Patient & Session Context"  --> "Lifecycle Context"           : triggers transitions
"Lifecycle Context"          --> "AI Pipeline Context"         : TRANSCRIBED event\ntriggers SOAP gen
"Lifecycle Context"          --> "Audit & Admin Context"       : every transition\nlogged
"AI Pipeline Context"        --> "Patient & Session Context"   : writes soap, entities\nto session
"Review & Sharing Context"   --> "Patient & Session Context"   : reads/updates session
"Review & Sharing Context"   --> "Lifecycle Context"           : asserts transitions
"Profile Builder Context"    --> "Patient & Session Context"   : builds Patient entity
"Prescription Context"       --> "Review & Sharing Context"    : shares via\nnotification templates
"Audit & Admin Context"      --> "Auth & Access Context"       : UserService manages\nUser entities

@enduml
```

---

## Activity Diagram — Domain Event Flow Across Contexts

**What this shows:** The same 8 bounded contexts as a swim-lane activity diagram, with each swim lane representing one context. This makes the handoff points between contexts explicit — every transition across a lane boundary is an architectural integration point.

**Key flows to note:**
- After the AI Pipeline Context finishes SOAP generation, control passes to the **Lifecycle Context** (`ConsultationEventPublisher.publish()`), not directly back to the session. This is the Observer pattern in action — the pipeline does not know who listens, ensuring decoupling.
- The **Review & Sharing Context** hosts the only human decision point in the system (Approve / Reject). This is the human-in-the-loop gate required by NFR-01: no AI output enters permanent storage without a doctor action.
- The **Reject** branch loops back into the AI Pipeline Context for regeneration, then re-enters UNDER_REVIEW. This is the only valid escape from the REJECTED state.
- The **Audit & Admin Context** lane is shown as a parallel terminal: every action in every other lane produces an append to `audit_logs`. It is passive — it never drives the flow, only records it.

```plantuml
@startuml Logical_Activity_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam activityBorderColor #555
skinparam activityBackgroundColor #FFFFFF
skinparam arrowColor #444
skinparam noteBackgroundColor #FFFFEE
skinparam noteBorderColor #AAAAAA

title ScribeHealth AI — Domain Event Flow (Bounded Context Transitions)

|Auth & Access Context|
start
:Doctor authenticates;
note right: JWT issued\naudit: login_success
:Role-based access granted;

|Patient & Session Context|
:Doctor selects patient\ncreates session;
note right: Status = SCHEDULED
:Doctor starts recording;
note right: SCHEDULED → IN_PROGRESS
:Doctor stops recording;
note right: IN_PROGRESS → RECORDED\naudio saved to Supabase Storage

|AI Pipeline Context|
:Transcription requested\n(SarvamTranscriptionProvider);
note right: Async — non-blocking (NFR-02)\nwithRetry() × 3 if failure (NFR-05)
:Medical entities extracted\n(Claude Haiku);
note right: symptoms, diagnoses,\nmedications, allergies, vitals
:SOAP note generated\n(SoapNoteGenerator → Claude Sonnet);
note right: Template Method selects\nspecialty generator (NFR-03)

|Lifecycle Context|
:ConsultationEventPublisher.publish();
note right: Observer pattern (FR-12)\nAuditLoggerObserver\nDoctorNotifierObserver\nSessionStatusObserver

|Patient & Session Context|
:Session updated\nStatus = UNDER_REVIEW;

|Review & Sharing Context|
:Doctor reviews\nand edits note;
note right: audit: note_edited

if (Doctor decision?) then (Approve)
  :assertTransition(UNDER_REVIEW → APPROVED);
  :Note locked permanently;
  note right: APPROVED is terminal\naudit: note_approved
  |Review & Sharing Context|
  :Share note via\nEmail / WhatsApp / SMS;
  note right: FR-09 sharing channels
else (Reject)
  :assertTransition(UNDER_REVIEW → REJECTED);
  note right: audit: note_rejected
  |AI Pipeline Context|
  :Regenerate SOAP note;
  :assertTransition(REJECTED → UNDER_REVIEW);
  note right: Regeneration path
endif

|Audit & Admin Context|
:Every action appended\nto audit_logs (immutable);
note right: NFR-04\nAdmin views via /api/admin/audit-logs

stop

@enduml
```
