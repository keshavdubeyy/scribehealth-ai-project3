# ScribeHealth AI — Subsystem Class Diagrams

> Diagrams are scoped to architecturally significant classes, fields, and relationships.
> Boilerplate getters/setters are omitted. FRs and NFRs satisfied by each subsystem are annotated.

---

## 1. Auth & Access Subsystem
> **FR-01** (doctor login/register, role enforcement) · **FR-02** (admin management) · **NFR-01** (JWT security, TLS, 8-hr expiry)

```plantuml
@startuml Auth_Access_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

enum Role { 
  DOCTOR
  ADMIN
}

class User <<entity: profiles>> {
  - email : String  <<PK>>
  - name : String
  - role : Role
  - passwordHash : String
  - isActive : boolean
  - specialization : String
  - licenseNumber : String
  - createdAt : Instant
  - lastLoginAt : Instant
  + getDoctorProfile() : DoctorProfile
}

class DoctorProfile {
  - specialization : String
  - licenseNumber : String
}

class JwtUtil <<@Component>> {
  + generateToken(email, role, userId) : String
  + validateToken(token) : boolean
  + extractEmail(token) : String
  + extractRole(token) : String
}

class JwtAuthFilter <<OncePerRequestFilter>> {
  + doFilterInternal(...) : void
}

class SecurityConfig <<@Configuration>> {
  + securityFilterChain(http) : SecurityFilterChain
  + passwordEncoder() : PasswordEncoder
}

interface AuthService {
  + login(LoginRequest) : AuthResponse
  + register(RegisterRequest) : AuthResponse
  + logout(email) : void
  + getCurrentUser(email) : User
}

class AuthServiceImpl <<@Service>> {
  - userRepository : UserRepository
  - passwordEncoder : PasswordEncoder
  - jwtUtil : JwtUtil
  - auditService : AuditService
}

interface DoctorProfileService {
  + getProfile(email) : User
  + updateProfile(email, specialization, licenseNumber) : User
}

class DoctorProfileServiceImpl <<@Service>> {
  - userRepository : UserRepository
}

interface UserRepository <<JpaRepository<User,String>>> {
  + findByEmail(email) : Optional<User>
  + existsByEmail(email) : boolean
}

class AuthController <<@RestController: /api/auth>> {
  + login() : ResponseEntity<AuthResponse>
  + register() : ResponseEntity<AuthResponse>
  + logout() : ResponseEntity<Void>
  + getCurrentUser() : ResponseEntity<UserProfileResponse>
}

class DoctorController <<@RestController: /api/doctor>> {
  + getProfile() : ResponseEntity<ProfileResponse>
  + updateProfile() : ResponseEntity
}

' DTOs
class LoginRequest { 
  email
  password
}
class RegisterRequest { 
  name
  email
  password
  mode
  role
  doctorProfile
}
class AuthResponse { 
  token
  name
  email
  role
}

User --> Role
User ..> DoctorProfile : derives
AuthServiceImpl ..|> AuthService
DoctorProfileServiceImpl ..|> DoctorProfileService
AuthServiceImpl --> UserRepository
AuthServiceImpl --> JwtUtil
AuthServiceImpl --> AuditService
DoctorProfileServiceImpl --> UserRepository
SecurityConfig --> JwtAuthFilter
JwtAuthFilter --> JwtUtil
AuthController --> AuthService
DoctorController --> DoctorProfileService
@enduml
```

---

## 2. Patient & Session Subsystem
> **FR-01** (doctor-scoped CRUD) · **FR-03** (session creation) · **FR-06** (SOAP note storage) · **FR-11** (status field) · **NFR-02** (CRUD under 500ms)

```plantuml
@startuml Patient_Session_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

class Patient <<entity: patients>> {
  - id : String  <<PK>>
  - doctorEmail : String
  - name : String
  - age : Integer
  - gender : String
  - email : String
  - phone : String
  - chronicConditions : List<ChronicCondition>  <<jsonb>>
  - allergies : List<PatientAllergy>  <<jsonb>>
  - emergencyContact : EmergencyContact  <<jsonb>>
  - insuranceDetails : InsuranceDetails  <<jsonb>>
  - createdAt : Instant
}

class ClinicalSession <<entity: sessions>> {
  - id : String  <<PK>>
  - patientId : String
  - doctorEmail : String
  - status : String  <<default:SCHEDULED>>
  - soap : SoapNote  <<jsonb>>
  - transcription : String
  - audioUrl : String
  - edits : String  <<jsonb>>
  - createdAt : Instant
}

class SoapNote <<inner>> {
  - s : String
  - o : String
  - a : String
  - p : String
}

class ChronicCondition {
  name : String
  icdCode : String
  diagnosedYear : Integer
}
class PatientAllergy {
  substance : String
  severity : Severity
  reaction : String
}
enum "PatientAllergy.Severity" as Severity {
  mild
  moderate
  severe
}
class EmergencyContact {
  name : String
  relationship : String
  phone : String
}
class InsuranceDetails {
  provider : String
  policyNumber : String
  validUntil : String
}

interface PatientRepository <<JpaRepository<Patient,String>>> {
  + findByDoctorEmail(email) : List<Patient>
  + findByIdAndDoctorEmail(id, email) : Optional<Patient>
}

interface SessionRepository <<JpaRepository<ClinicalSession,String>>> {
  + findByPatientId(patientId) : List<ClinicalSession>
  + findByDoctorEmail(email) : List<ClinicalSession>
}

interface PatientService {
  + getPatientsForDoctor(email) : List<Patient>
  + getPatient(id, email) : Patient
  + createPatient(email, CreatePatientRequest) : Patient
  + updatePatient(email, id, UpdatePatientRequest) : Patient
  + deletePatient(email, id) : void
}

class PatientServiceImpl <<@Service>> {
  - patientRepository : PatientRepository
  - auditService : AuditService
}

interface SessionService {
  + getSessionsByDoctor(email) : List<ClinicalSession>
  + getSessionsByPatient(email, patientId) : List<ClinicalSession>
  + createSession(email, session) : ClinicalSession
  + updateSession(email, id, session) : ClinicalSession
  + transitionSession(email, id, targetStatus) : ClinicalSession
  + deleteSession(id, email) : void
}

class SessionServiceImpl <<@Service>> {
  - sessionRepository : SessionRepository
  - patientRepository : PatientRepository
  - auditService : AuditService
  - publisher : ConsultationEventPublisher
}

class PatientController <<@RestController: /api/patients>> {
  + getMyPatients() : List<Patient>
  + createPatient() : ResponseEntity
  + updatePatient() : ResponseEntity
  + deletePatient() : ResponseEntity
}

class SessionController <<@RestController: /api/sessions>> {
  + getMySessions() : List<ClinicalSession>
  + createSession() : ClinicalSession
  + updateSession() : ClinicalSession
  + transitionSession() : ClinicalSession
  + deleteSession() : void
}

ClinicalSession +-- SoapNote
PatientAllergy +-- Severity
Patient "1" *-- "0..*" ChronicCondition
Patient "1" *-- "0..*" PatientAllergy
Patient "1" *-- "0..1" EmergencyContact
Patient "1" *-- "0..1" InsuranceDetails
ClinicalSession "0..*" --> "1" Patient : patientId

PatientServiceImpl ..|> PatientService
SessionServiceImpl ..|> SessionService
PatientServiceImpl --> PatientRepository
SessionServiceImpl --> SessionRepository
SessionServiceImpl --> PatientRepository
PatientController --> PatientService
SessionController --> SessionService
@enduml
```

---

## 3. AI Pipeline Subsystem
> **FR-04** (async transcription + retry) · **FR-05** (entity extraction) · **FR-06** (SOAP generation) · **FR-07** (specialty templates) · **NFR-02** (non-blocking) · **NFR-03** (extensibility via patterns)

```plantuml
@startuml AI_Pipeline_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

note "Factory Method Pattern (NFR-03)\nNew provider = new class + 1 env var change" as NF

interface TranscriptionProvider {
  + name : string  <<readonly>>
  + transcribe(audioBuffer, mimeType?) : Promise<string>
}

class SarvamTranscriptionProvider {
  + name = "sarvam"
  - apiKey : string
  + transcribe(audioBuffer, mimeType?) : Promise<string>
}
note right : POST sarvam.ai/speech-to-text\nmodel: saarika:v2.5

class TranscriptionServiceFactory {
  + {static} create(provider?) : TranscriptionProvider
}
note right : Reads TRANSCRIPTION_PROVIDER env\nDefault = "sarvam"

note "Template Method Pattern (NFR-03)\nNew specialty = new subclass only" as NT

abstract class SoapNoteGenerator {
  + templateName : string  <<abstract>>
  + fields : string[]  <<abstract>>
  + generate(transcript, client: Anthropic) : Promise<Record<string,string>>
  # specialtyContext() : string
  - callModel(transcript, client) : Promise<Record<string,string>>
  - normaliseFields(raw) : Record<string,string>
}

class GeneralOpdNoteGenerator {
  templateName = "general_opd"
  fields = [subjective, objective, assessment,\ndiagnosis, prescription, advice, follow_up]
}
class MentalHealthNoteGenerator {
  templateName = "mental_health_soap"
  # specialtyContext() : string
}
class PhysiotherapyNoteGenerator {
  templateName = "physiotherapy"
  # specialtyContext() : string
}
class PediatricNoteGenerator {
  templateName = "pediatric"
  # specialtyContext() : string
}
class CardiologyNoteGenerator {
  templateName = "cardiology"
  # specialtyContext() : string
}
class SurgicalFollowupNoteGenerator {
  templateName = "surgical_followup"
  # specialtyContext() : string
}

class NoteGeneratorFactory {
  + {static} get(templateName) : SoapNoteGenerator
  + {static} templateNames() : string[]
}

interface MedicalEntities {
  + symptoms : string[]
  + diagnoses : string[]
  + medications : Array<{name,dosage,frequency}>
  + allergies : Array<{substance,severity}>
  + vitals : Array<{metric,value,unit}>
  + treatmentPlans : string[]
}

SarvamTranscriptionProvider ..|> TranscriptionProvider
TranscriptionServiceFactory ..> TranscriptionProvider : <<creates>>

GeneralOpdNoteGenerator --|> SoapNoteGenerator
MentalHealthNoteGenerator --|> SoapNoteGenerator
PhysiotherapyNoteGenerator --|> SoapNoteGenerator
PediatricNoteGenerator --|> SoapNoteGenerator
CardiologyNoteGenerator --|> SoapNoteGenerator
SurgicalFollowupNoteGenerator --|> SoapNoteGenerator
NoteGeneratorFactory ..> SoapNoteGenerator : <<selects>>
@enduml
```

---

## 4. Profile Builder Subsystem
> **FR-01** (patient record creation) · **NFR-01** (data integrity via validation before persistence)

```plantuml
@startuml Profile_Builder_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

note "Builder Pattern\nValidated construction of complex Patient profiles" as NB

class PatientProfileBuilder {
  - name : String  <<final>>
  - age : int  <<final>>
  - gender : String  <<final>>
  - doctorEmail : String
  - organizationId : String
  - email : String
  - phone : String
  - chronicConditions : List<ChronicCondition>
  - allergies : List<PatientAllergy>
  - emergencyContact : EmergencyContact
  - insuranceDetails : InsuranceDetails
  ..Validation rules..
  EMAIL_PATTERN : /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  ICD_PATTERN   : /^[A-Z][0-9]{2}(\.[0-9]+)?$/
  phone         : ≥7 digits
  age           : 0–150
  ..Builder methods..
  + withDoctorEmail(v) : PatientProfileBuilder
  + withEmail(v) : PatientProfileBuilder
  + withPhone(v) : PatientProfileBuilder
  + withChronicConditions(v) : PatientProfileBuilder
  + withAllergies(v) : PatientProfileBuilder
  + withEmergencyContact(v) : PatientProfileBuilder
  + withInsuranceDetails(v) : PatientProfileBuilder
  + build() : Patient
  - validate() : void
}

class PatientProfileValidationException {
  + PatientProfileValidationException(message)
}
note right : extends RuntimeException

class PatientServiceImpl <<@Service>> {
  + createPatient(email, req) : Patient
}

PatientProfileBuilder ..> PatientProfileValidationException : <<throws on invalid>>
PatientProfileBuilder ..> Patient : <<builds>>
PatientServiceImpl ..> PatientProfileBuilder : <<uses>>
@enduml
```

---

## 5. Lifecycle & Notifications Subsystem
> **FR-11** (state transition enforcement) · **FR-12** (observer-driven notifications) · **NFR-04** (audit on every transition) · **NFR-05** (state persistence, no illegal jumps)

```plantuml
@startuml Lifecycle_Notifications_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

note "State Pattern (FR-11)\nIllegal transitions throw — APPROVED is terminal" as NS

interface ConsultationState {
  + statusName() : String
  + transitionTo(targetStatus) : ConsultationState
}

class ScheduledState {
  statusName() = "SCHEDULED"
  note: allows IN_PROGRESS
}
class InProgressState {
  statusName() = "IN_PROGRESS"
  note: allows RECORDED
}
class RecordedState {
  statusName() = "RECORDED"
  note: allows TRANSCRIBED
}
class TranscribedState {
  statusName() = "TRANSCRIBED"
  note: allows UNDER_REVIEW
}
class UnderReviewState {
  statusName() = "UNDER_REVIEW"
  note: allows APPROVED or REJECTED
}
class ApprovedState <<terminal>> {
  statusName() = "APPROVED"
}
class RejectedState {
  statusName() = "REJECTED"
  note: allows UNDER_REVIEW
}

class IllegalStateTransitionException {
  IllegalStateTransitionException(from, to)
}

class ConsultationStateFactory {
  + {static} fromStatus(status) : ConsultationState
}

ScheduledState   ..|> ConsultationState
InProgressState  ..|> ConsultationState
RecordedState    ..|> ConsultationState
TranscribedState ..|> ConsultationState
UnderReviewState ..|> ConsultationState
ApprovedState    ..|> ConsultationState
RejectedState    ..|> ConsultationState
ConsultationState ..> IllegalStateTransitionException : <<throws on invalid>>
ConsultationStateFactory ..> ConsultationState : <<creates>>

note "Observer Pattern (FR-12)\nPublisher notifies all subscribers on every transition" as NO

class ConsultationEvent {
  - sessionId : String
  - doctorEmail : String
  - fromStatus : String
  - toStatus : String
}

interface ConsultationObserver {
  + onEvent(event : ConsultationEvent) : void
}

class ConsultationEventPublisher {
  - observers : List<ConsultationObserver>
  + subscribe(observer) : void
  + unsubscribe(observer) : void
  + publish(event) : void
}

class AuditLoggerObserver {
  - auditService : AuditService
  + onEvent(event) : void
}
note right : toStatus → audit action\n(session_started, note_approved…)

class DoctorNotifierObserver {
  + onEvent(event) : void
}
note right : Logs INFO for\nUNDER_REVIEW, APPROVED, REJECTED

class SessionStatusObserver {
  + onEvent(event) : void
}
note right : Logs all lifecycle transitions

AuditLoggerObserver    ..|> ConsultationObserver
DoctorNotifierObserver ..|> ConsultationObserver
SessionStatusObserver  ..|> ConsultationObserver
ConsultationEventPublisher "1" o-- "0..*" ConsultationObserver
ConsultationEventPublisher ..> ConsultationEvent : publishes
AuditLoggerObserver --> AuditService

note "Frontend mirror (TypeScript)\nFR-11 enforced client-side too" as NTS
class SessionStateMachine <<TS module>> {
  + {static} VALID_TRANSITIONS : Record<SessionStatus, SessionStatus[]>
  + {static} canTransition(from, to) : boolean
  + {static} assertTransition(from, to) : void
}

class SessionServiceImpl <<@Service>> {
  + transitionSession(email, id, targetStatus) : ClinicalSession
}
SessionServiceImpl --> ConsultationStateFactory
SessionServiceImpl --> ConsultationEventPublisher
@enduml
```

---

## 6. Audit & Admin Subsystem
> **FR-02** (admin user management, audit dashboard) · **FR-10** (immutable action logging) · **NFR-04** (append-only audit, admin-only access)

```plantuml
@startuml Audit_Admin_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

class AuditLog <<entity: audit_logs>> {
  - id : UUID  <<PK, auto>>
  - userEmail : String
  - action : String
  - entityType : String
  - entityId : String
  - metadata : String  <<jsonb>>
  - createdAt : Instant  <<append-only>>
}
note right : Immutable — no update/delete\nactions: login_success, logout,\npatient_created/updated/deleted,\nsession_created/deleted,\nnote_approved/rejected…

interface AuditLogRepository <<JpaRepository<AuditLog,UUID>>> {
  + findRecentLogs(limit, offset) : List<AuditLog>
}

interface AuditService {
  + log(userEmail, action, entityType, entityId) : void
  + log(userEmail, action, entityType, entityId, metadataJson) : void
  + getRecentLogs(limit, offset) : List<AuditLog>
}

class AuditServiceImpl <<@Service>> {
  - auditLogRepository : AuditLogRepository
}
note right : Failures silently swallowed —\naudit must never block callers

interface UserService {
  + getAllUsers() : List<User>
  + getUser(id) : User
  + createUser(RegisterRequest) : User
  + activateUser(id) : User
  + deactivateUser(id) : User
  + getStats() : Map<String,Long>
}

class UserServiceImpl <<@Service>> {
  - userRepository : UserRepository
  - passwordEncoder : PasswordEncoder
}

class AdminFacade <<@Component>> {
  - userService : UserService
  - auditService : AuditService
  + getAllUsers() : List<User>
  + getUser(id) : User
  + createUser(request, actorEmail) : User
  + activateUser(targetId, actorEmail) : void
  + deactivateUser(targetId, actorEmail) : void
  + getStats() : Map<String,Long>
  + getAuditLogs(limit, offset) : List<AuditLog>
}
note right : Facade Pattern\nSingle entry-point for all admin ops\nHides UserService + AuditService coordination

class AdminController <<@RestController: /api/admin>> {
  + getAllUsers() : ResponseEntity
  + createUser() : ResponseEntity
  + activateUser() : ResponseEntity
  + deactivateUser() : ResponseEntity
  + getStats() : ResponseEntity
  + getAuditLogs() : ResponseEntity
}
note right : @PreAuthorize("hasRole('ADMIN')")

class AuditServer <<TS module>> {
  + {static} logAuditServer(userEmail, action,\n  entityType, entityId, metadata?) : Promise<void>
}
note right : Server-side — called from\nNextAuth signIn/signOut events

class AuditClient <<TS module>> {
  + {static} logAudit(action, entityType,\n  entityId, metadata?) : Promise<void>
}
note right : Client-side fire-and-forget\nPOST /api/audit

AuditServiceImpl ..|> AuditService
UserServiceImpl ..|> UserService
AuditServiceImpl --> AuditLogRepository
AdminFacade --> UserService
AdminFacade --> AuditService
AdminController --> AdminFacade
@enduml
```

---

## 7. Review & Sharing Subsystem
> **FR-08** (doctor review / approve / reject) · **FR-09** (note sharing via Email/WhatsApp/SMS) · **NFR-01** (no AI output without doctor approval) · **NFR-04** (every approval logged)

```plantuml
@startuml Review_Sharing_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

note "Human-in-the-loop (NFR-01)\nNo AI note enters permanent record without doctor Approve" as NH

class ClinicalSession <<entity: sessions>> {
  - id : String
  - status : String
  - soap : SoapNote  <<jsonb>>
  - edits : String  <<jsonb>>
}

class SoapNote <<inner>> {
  - s : String  (Subjective)
  - o : String  (Objective)
  - a : String  (Assessment)
  - p : String  (Plan)
}

ClinicalSession +-- SoapNote

class SessionController <<@RestController: /api/sessions>> {
  + transitionSession(email, id, {status}) : ClinicalSession
  + updateSession(email, id, session) : ClinicalSession
}

class SessionServiceImpl <<@Service>> {
  + transitionSession(email, id, targetStatus) : ClinicalSession
  + updateSession(email, id, session) : ClinicalSession
}

class ScribeStore <<Zustand store>> {
  + transitionSession(id, status, extraData?) : Promise<void>
  + updateSession(id, data) : Promise<void>
}
note right : Calls assertTransition() before DB write\nstatus: UNDER_REVIEW → APPROVED | REJECTED\nREJECTED → UNDER_REVIEW (regenerate path)

class NotificationTemplates <<TS module>> {
  + {static} noteReadyTemplate(patientName, sessionId) : TemplateResult
  + {static} noteApprovedTemplate(patientName, sessionId) : TemplateResult
  + {static} noteRejectedTemplate(patientName, sessionId) : TemplateResult
  + {static} noteSharingTemplate(patientName, note) : TemplateResult
  + {static} prescriptionSharingTemplate(patientName, data) : TemplateResult
  + {static} sendSystemNotification(to, subject, body, event) : Promise<void>
}
note right : Sharing channels:\nEmail   → mailto:\nWhatsApp → wa.me/\nSMS     → sms:

SessionController --> SessionServiceImpl
ScribeStore ..> NotificationTemplates : uses for sharing (FR-09)
@enduml
```

---

## 8. Prescription Generator Subsystem
> **FR-09** (prescription sharing) · **NFR-03** (template-based, extensible canvas layout)

```plantuml
@startuml Prescription_Generator_Subsystem
skinparam classAttributeIconSize 0
skinparam packageStyle rectangle

class Medicine {
  + name : string
  + dose : string
  + frequency : MedicineFrequency | string
  + duration : string
  + timing : MedicineTiming | string
}

class Prescription {
  + patient_name : string
  + patient_age : string
  + chief_complaint : string
  + diagnosis : string
  + medicines : Medicine[]
  + next_steps : string[]
}

class SafeZone {
  + xPct : number
  + yPct : number
  + widthPct : number
  + heightPct : number
  + fontSizePt : number
  + lineHeightPt : number
}
note right : Percentage-based canvas coordinates\nfor template image overlay

class PrescriptionTemplate <<entity: prescription_templates>> {
  + id : string
  + imagePath : string
  + imageUrl : string
  + imageWidth : number
  + imageHeight : number
  + safeZone : SafeZone
}

class ScribeStore <<Zustand store>> {
  + prescriptionTemplate : PrescriptionTemplate | null
  + fetchPrescriptionTemplate() : Promise<void>
  + setPrescriptionTemplate(template) : void
}

class PrescriptionsGenerateRoute <<POST /api/prescriptions/generate>> {
  + POST(request) : NextResponse  <<PDF blob>>
}
note right : AI auto-fills prescription fields\nfrom session SOAP/transcript

class PrescriptionTemplatesRoute <<GET|POST /api/prescription-templates>> {
  + GET() : NextResponse
  + POST() : NextResponse
}
note right : Manage doctor's letterhead\ntemplate + safe-zone config

class NotificationTemplates <<TS module>> {
  + {static} prescriptionSharingTemplate(patientName, data) : TemplateResult
}
note right : Generates prescription message body\nfor Email / WhatsApp / SMS

Prescription *-- Medicine
PrescriptionTemplate *-- SafeZone
ScribeStore --> PrescriptionTemplate
ScribeStore ..> PrescriptionsGenerateRoute : calls
ScribeStore ..> PrescriptionTemplatesRoute : calls
PrescriptionsGenerateRoute ..> Prescription : generates
ScribeStore ..> NotificationTemplates : uses for sharing
@enduml
```
