# Team Contributions — ScribeHealth AI
## CS6.401 Software Engineering · Spring 2026

---

## Division of Work

The system was divided into 8 subsystems, 7 design patterns, 12 FRs, and 5 NFRs across 5 team members. Each member owned a vertical slice — subsystem design → pattern implementation → requirements traceability — so that contributions are coherent and attributable end-to-end.

---

## Member 1 — Dhawal Pawanarkar (2025204005)

**Subsystems owned:** AI Pipeline (SS2), Lifecycle & Notifications (SS4)

**Design patterns implemented:**
- Factory Method — `frontend/lib/transcription-factory.ts` (`TranscriptionServiceFactory`, `SarvamTranscriptionProvider`, `TranscriptionProvider` interface)
- Template Method — `frontend/lib/soap-note-generator.ts` (`SoapNoteGenerator` abstract class + 6 specialty subclasses: General OPD, Cardiology, Mental Health, Physiotherapy, Pediatric, Surgical Follow-up)
- State — `backend/java/lifecycle/state/` (`ConsultationState`, `ConsultationStateFactory`, all 7 concrete states) + `frontend/lib/session-state-machine.ts` (TypeScript mirror)
- Observer — `backend/java/lifecycle/observer/` (`ConsultationEventPublisher`, `AuditLoggerObserver`, `DoctorNotifierObserver`, `SessionStatusObserver`)

**Functional requirements owned:** FR-04 (async transcription with retry), FR-05 (entity extraction), FR-06 (SOAP note generation), FR-07 (specialty templates), FR-11 (state machine enforcement), FR-12 (lifecycle notifications)

**NFRs owned:** NFR-02 (performance — async non-blocking pipeline), NFR-03 (extensibility — Factory + Template Method), NFR-05 (reliability — `withRetry()` × 3 with backoff)

**Architecture diagrams produced:**
- `docs/Architectural_Tactics_&_Patterns/3.Component_Diagram_AI_Pipeline.puml`
- `docs/Architectural_Tactics_&_Patterns/4.Sequence_Diagram_Sync_SOAP.puml`
- `docs/Architectural_Tactics_&_Patterns/5.Sequence_Diagram_Async_Transcription.puml`
- `docs/Architectural_Tactics_&_Patterns/8.Factory_Method_Pattern.puml`
- `docs/Architectural_Tactics_&_Patterns/9.Template_Method_Pattern.puml`
- `docs/Architectural_Tactics_&_Patterns/10.Observer_Pattern.puml`
- `docs/Architectural_Tactics_&_Patterns/11.State_Pattern.puml`
- `docs/Architecture_Framework/2_Process view/State_Machine.puml`
- `docs/Architecture_Framework/2_Process view/Audio_Pipeline_Flow.puml`

**Key commits:** `add state pattern`, `add observer pattern`, `add factory method pattern`, `add template method for SOAP notes`, `wire state and observer into session service`

---

## Member 2 — Keshav Dubey (2025204041)

**Subsystems owned:** Auth & Access (SS0), Audit & Admin (SS5), Review & Sharing (SS6 — approval/rejection workflow)

**Design patterns implemented:**
- Facade — `backend/java/facade/AdminFacade.java` (single entry-point for all admin operations: user management + audit log access)
- Service Layer — `backend/java/service/` (all service interfaces + implementations: `AuthServiceImpl`, `UserServiceImpl`, `AuditServiceImpl`, `DoctorProfileServiceImpl`)

**Functional requirements owned:** FR-01 (authentication, role-based access), FR-02 (admin user management + audit log UI), FR-08 (doctor review/approve/reject workflow), FR-09 (note sharing via Email/WhatsApp/SMS), FR-10 (complete audit logging for all actions)

**NFRs owned:** NFR-01 (security — JWT 8-hr expiry, TLS, PHI isolation), NFR-04 (auditability — immutable append-only `audit_logs`, admin-only access)

**Architecture diagrams produced:**
- `docs/Architectural_Tactics_&_Patterns/1.C4_Context_Diagram.puml`
- `docs/Architectural_Tactics_&_Patterns/2.C4_Container_Diagram.puml`
- `docs/Requirements_&_Subsystems/Subsystems/1.Auth & Access Subsystem.puml`
- `docs/Requirements_&_Subsystems/Subsystems/6.Audit & Admin Subsystem.puml`
- `docs/Requirements_&_Subsystems/Subsystems/7.Review & Sharing Subsystem.puml`

**Key commits:** `implement AdminFacade pattern`, `complete audit logging across templates, sessions, and admin actions`, `implement user activation API`, `feat: inject isActive status into NextAuth session`

---

## Member 3 — Praneeth Reddy (2025204004)

**Subsystems owned:** Patient & Session (SS1 — backend), Audit & Admin (SS5 — backend service layer co-ownership)

**Design patterns implemented:**
- Service Layer (co-implemented) — `backend/java/service/AuditService`, `AuditServiceImpl`, `UserService`, `UserServiceImpl`
- Contributed to Facade — `AdminFacade` integration with `AuditService` and `UserService`

**Functional requirements owned:** FR-02 (audit log backend — `AuditLog` entity, `AuditLogRepository`, audit API), FR-03 (session creation and recording backend), FR-10 (server-side audit logging — `logAuditServer` via NextAuth events)

**NFRs owned:** NFR-04 (auditability — backend: append-only `audit_logs` table design, no UPDATE/DELETE enforced at service layer)

**Architecture diagrams produced:**
- `docs/Architectural_Tactics_&_Patterns/6.Deployment_Diagram.puml`
- `docs/Architectural_Tactics_&_Patterns/7.Data_Model_Diagram.puml`
- `docs/Architecture_Framework/3_Development view/Package_Structure_Diagram.puml`
- `docs/Architecture_Framework/3_Development view/CI_CD_Pipeline.puml`
- `docs/Requirements_&_Subsystems/Subsystems/2.Patient & Session Subsystem.puml`

**Key commits:** `implement Service Layer and Audit Logging patterns in Java backend`, `implement AdminFacade pattern and role-based method security`, `updated frontend`

---

## Member 4 — Devansh Singh (2025204007)

**Subsystems owned:** Profile Builder (SS3), Patient & Session (SS1 — frontend + patient profile schema)

**Design patterns implemented:**
- Builder — `backend/java/builder/PatientProfileBuilder.java` (validated construction of `Patient` with ICD code validation, email regex, age bounds, phone length) + `frontend/lib/patient-profile-builder.ts` (TypeScript mirror)

**Functional requirements owned:** FR-03 (patient profile creation and management — `PatientController`, `PatientProfileService`, `PatientProfileRepository`), FR-08 (frontend session edit + update flow)

**NFRs owned:** NFR-02 (performance — frontend state management via Zustand `mock-store.ts`, non-blocking UI updates)

**Architecture diagrams produced:**
- `docs/Requirements_&_Subsystems/Subsystems/4.Profile Builder Subsystem.puml`
- `docs/Requirements_&_Subsystems/Context and Event flow Diagrams/System_Context_Diagram.puml`
- `docs/Requirements_&_Subsystems/Context and Event flow Diagrams/Strategic Domain Event Flow.puml`
- `docs/Architecture_Framework/1_Logical view/Package Diagram.puml`
- `docs/Architecture_Framework/1_Logical view/Activity Diagram.puml`

**Key commits:** `Implement patient profile builder flow with validated optional blocks`, `add builder pattern for patient profile construction`

---

## Member 5 — Eshwar Pingili (2025204021)

**Subsystems owned:** Prescription Generator (SS7), Lifecycle & Notifications (SS4 — frontend notification templates)

**Design patterns implemented:**
- Observer (frontend) — `frontend/lib/notifications.ts` (`NotificationTemplates`: `noteReadyTemplate`, `noteApprovedTemplate`, `noteRejectedTemplate`, `noteSharingTemplate`, `prescriptionSharingTemplate`, `sendSystemNotification`)

**Functional requirements owned:** FR-06 (prescription generation — `PrescriptionsGenerateRoute`, canvas template overlay), FR-09 (prescription sharing — `prescriptionSharingTemplate`, `mailto:/wa.me:/sms:` integration), FR-12 (frontend notification dispatch — notification templates wired to session lifecycle events)

**NFRs owned:** NFR-01 (security — frontend: no PHI exposed in notification payloads; sharing links use device-native apps, no server relay)

**Architecture diagrams produced:**
- `docs/Architecture_Framework/4_Deployment view/Infrastructure.puml`
- `docs/Architecture_Framework/5_Use Case Diagrams/All_Actors.puml`
- `docs/Architecture_Framework/5_Use Case Diagrams/Scenario_1.puml`
- `docs/Architecture_Framework/5_Use Case Diagrams/Scenario_2.puml`
- `docs/Requirements_&_Subsystems/Subsystems/3.AI Pipeline Subsystem.puml`
- `docs/Requirements_&_Subsystems/Subsystems/5.Lifecycle & Notifications Subsystem.puml`
- `docs/Requirements_&_Subsystems/Subsystems/8.Prescription Generator Subsystem.puml`

**Key commits:** `docs: add Architecture Framework views (Logical, Process, Development, Deployment, Use Case)`, `docs: add subsystem diagrams (all 8 subsystems)`

---

## Summary Matrix

| Member | Subsystems | Patterns | FRs | NFRs |
|--------|-----------|---------|-----|------|
| Dhawal Pawanarkar | SS2 AI Pipeline, SS4 Lifecycle | Factory Method, Template Method, State, Observer | FR-04, FR-05, FR-06, FR-07, FR-11, FR-12 | NFR-02, NFR-03, NFR-05 |
| Keshav Dubey | SS0 Auth & Access, SS5 Audit & Admin, SS6 Review & Sharing | Facade, Service Layer | FR-01, FR-02, FR-08, FR-09, FR-10 | NFR-01, NFR-04 |
| Praneeth Reddy | SS1 Patient & Session (backend), SS5 Audit (co-owner) | Service Layer (co), Facade (co) | FR-02, FR-03, FR-10 | NFR-04 |
| Devansh Singh | SS3 Profile Builder, SS1 Patient & Session (frontend) | Builder | FR-03, FR-08 | NFR-02 |
| Eshwar Pingili | SS7 Prescription Generator, SS4 Notifications (frontend) | Observer (frontend) | FR-06, FR-09, FR-12 | NFR-01 |

---

## Notes on Collaboration

- SS1 (Patient & Session) was split: Praneeth owned the Java backend (`PatientController`, `PatientProfileService`, `PatientProfileRepository`) while Devansh owned the TypeScript frontend profile builder and schema.
- SS4 (Lifecycle & Notifications) was split: Dhawal owned the Java State + Observer engine; Eshwar owned the frontend notification template layer.
- SS5 (Audit & Admin) was co-owned: Praneeth built the backend audit service and entity; Keshav built the AdminFacade, admin controller, and frontend audit log UI.
- The architecture report (`main.tex` on Overleaf) was authored by Dhawal with input from all members.
