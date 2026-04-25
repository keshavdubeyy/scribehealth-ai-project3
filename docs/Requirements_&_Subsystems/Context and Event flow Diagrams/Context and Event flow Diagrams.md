# ScribeHealth AI — System Overview Diagrams

---

## 1. System Context Diagram

> Shows ScribeHealth AI as a system boundary with all external actors and systems it interacts with.

```plantuml
@startuml System_Context_Diagram
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam packageStyle rectangle
skinparam rectangleBorderColor #555555
skinparam arrowColor #444444
skinparam actorBorderColor #333333

title ScribeHealth AI — System Context Diagram

actor "Doctor" as Doctor #LightSteelBlue
actor "Administrator" as Admin #LightSalmon
actor "Patient" as Patient #PaleGreen

rectangle "ScribeHealth AI\n(System Boundary)" as System #LightYellow {
  rectangle "Next.js Frontend\n(App Router + API Routes)" as FE #White
  rectangle "Spring Boot Backend\n(REST API + JPA)" as BE #White
  rectangle "AI Pipeline\n(Transcription + NLP + SOAP)" as AI #White
  rectangle "Audit & Admin\n(AuditLog + Facade)" as Audit #White
}

database "Supabase\n(PostgreSQL + Storage)" as DB #LightGray
cloud "Sarvam AI\nsaarika:v2.5" as Sarvam #FFFACD
cloud "Anthropic Claude\nHaiku + Sonnet" as Claude #FFFACD
cloud "Email / WhatsApp / SMS\n(Sharing Channels)" as Notify #E8F5E9
cloud "Supabase Auth\n(Identity + JWT)" as SupaAuth #F3E5F5

Doctor --> FE : login, record consultation,\nreview & approve notes
Admin --> FE : manage users,\nview audit logs
Patient <-- FE : receive approved\nnotes / prescriptions

FE --> BE : REST (Bearer JWT)
BE --> DB : JPA/Hibernate
FE --> DB : Supabase client (direct CRUD)
FE --> AI : /api/transcribe\n/api/generate-note\n/api/extract-entities
AI --> Sarvam : POST speech-to-text\n(audio buffer)
AI --> Claude : SOAP note generation\nentity extraction
FE --> SupaAuth : signIn / signOut\n(NextAuth Credentials)
BE --> SupaAuth : token validation (JWT)
FE --> Notify : mailto: / wa.me: / sms:\n(note & prescription sharing)
BE --> Audit : append audit_log\non every action

note right of System
  Layered + Event-Driven Architecture
  7 design patterns implemented
  FR-01 to FR-12 | NFR-01 to NFR-05
end note

@enduml
```

---

## 2. Strategic Domain Event Flow

> Traces the complete event-driven lifecycle: **Auth → Session Recording → AI Pipeline → Review → Notification**

```plantuml
@startuml Strategic_Domain_Event_Flow
skinparam backgroundColor #FAFAFA
skinparam defaultFontName Arial
skinparam sequenceArrowColor #444
skinparam sequenceLifeLineBorderColor #888
skinparam sequenceParticipantBorderColor #555
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFFF0

title ScribeHealth AI — Strategic Domain Event Flow\n(Auth → Recording → AI Pipeline → Review → Notification)

actor       "Doctor"                  as D
participant "Next.js Frontend\n(ScribeStore)"       as FE
participant "Spring Boot\nBackend"    as BE
participant "Supabase\n(PostgreSQL)"  as DB
participant "Sarvam AI"              as SAR
participant "Anthropic\nClaude"      as CL
participant "Notification\nChannel"  as NTF

== Auth Phase (FR-01 / NFR-01) ==

D -> FE : Enter credentials
FE -> BE : POST /api/auth/login
BE -> DB : findByEmail + verifyPassword (BCrypt)
DB --> BE : User{role, isActive}
BE -> BE : JwtUtil.generateToken(email, role, userId)
BE --> FE : AuthResponse{JWT, role}
FE -> DB : <<audit>> login_success
note right : Session cookie set\nJWT expires in 8 hrs

== Session Scheduling (FR-03 / FR-11) ==

D -> FE : Select patient → New Session
FE -> BE : POST /api/sessions
BE -> DB : INSERT sessions{status=SCHEDULED}
DB --> BE : ClinicalSession{id}
BE --> FE : session created
FE -> DB : <<audit>> session_created
note right : Domain event: SCHEDULED

== Audio Recording (FR-03) ==

D -> FE : Start Recording
FE -> FE : assertTransition(SCHEDULED → IN_PROGRESS)
FE -> DB : UPDATE sessions{status=IN_PROGRESS}
D -> FE : Stop Recording
FE -> FE : assertTransition(IN_PROGRESS → RECORDED)
FE -> DB : UPDATE sessions{status=RECORDED, audioUrl}
note right : Audio stored in\nSupabase Storage

== AI Pipeline (FR-04 / FR-05 / FR-06 / NFR-02 / NFR-03) ==

FE -> SAR : POST /api/transcribe\n(audio buffer, mimeType)
activate SAR
note right : TranscriptionServiceFactory\ncreates SarvamProvider\n(Factory Method — NFR-03)
SAR --> FE : transcript : String
deactivate SAR
FE -> FE : withRetry() — up to 3×\n1s → 2s backoff (NFR-05)
FE -> DB : UPDATE sessions{status=TRANSCRIBED, transcription}

FE -> CL : POST /api/extract-entities\n(transcript)
activate CL
CL --> FE : MedicalEntities{symptoms,\ndiagnoses, medications,\nallergies, vitals}
deactivate CL
FE -> DB : UPDATE sessions{entities}

FE -> CL : POST /api/generate-note\n(transcript, template)
activate CL
note right : NoteGeneratorFactory.get(template)\nSoapNoteGenerator.generate()\n(Template Method — NFR-03)
CL --> FE : SoapNote{s, o, a, p, ...}
deactivate CL
FE -> FE : assertTransition(TRANSCRIBED → UNDER_REVIEW)
FE -> DB : UPDATE sessions{status=UNDER_REVIEW, soap}

== Observer Notifications (FR-12 / NFR-04) ==

BE -> BE : ConsultationEventPublisher\n.publish(ConsultationEvent)
activate BE
BE -> BE : AuditLoggerObserver\n→ audit: note_ready
BE -> BE : DoctorNotifierObserver\n→ log INFO: note ready
BE -> BE : SessionStatusObserver\n→ log lifecycle transition
deactivate BE
FE -> DB : <<audit>> note_ready

== Review Phase (FR-08 / NFR-01 — human-in-the-loop) ==

D -> FE : Review note, edit fields
FE -> DB : UPDATE sessions{edits, soap (edited)}
FE -> DB : <<audit>> note_edited

alt Doctor Approves
  D -> FE : Click Approve
  FE -> FE : assertTransition(UNDER_REVIEW → APPROVED)
  FE -> BE : PATCH /api/sessions/{id}/transition {status=APPROVED}
  BE -> DB : UPDATE sessions{status=APPROVED}
  BE -> DB : <<audit>> note_approved
  note right : Note is now LOCKED\nNo further edits possible\nAPPROVED is terminal state
else Doctor Rejects
  D -> FE : Click Reject
  FE -> FE : assertTransition(UNDER_REVIEW → REJECTED)
  FE -> BE : PATCH /api/sessions/{id}/transition {status=REJECTED}
  BE -> DB : UPDATE sessions{status=REJECTED}
  BE -> DB : <<audit>> note_rejected
  FE -> FE : assertTransition(REJECTED → UNDER_REVIEW)
  note right : Regeneration path:\nRejected → regenerate note\n→ back to UNDER_REVIEW
end

== Sharing & Notification (FR-09 / FR-12) ==

D -> FE : Share approved note
FE -> NTF : noteSharingTemplate(patientName, note)
FE -> NTF : sendSystemNotification(doctor, subject, body)
note right : Channels: Email (mailto:)\nWhatsApp (wa.me/)\nSMS (sms:)\n\nnoteApprovedTemplate()\nnoteReadyTemplate()\nprescriptionSharingTemplate()

== Admin Audit Trail (FR-02 / FR-10 / NFR-04) ==

note over DB : Every action above writes an append-only\nrow to audit_logs{userEmail, action, entityType,\nentityId, metadata, createdAt}\n\nAdmin views via AdminFacade → AdminController\n/api/admin/audit-logs (ADMIN role only)

@enduml
```
