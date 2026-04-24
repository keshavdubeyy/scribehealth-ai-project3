# ScribeHealth AI — Design Patterns Verification Report

> **Date:** 2026-04-24  
> **Scope:** All Java files in `backend/java/src/main/java/com/scribehealth/` and all TypeScript files in `frontend/lib/`  
> **Methodology:** Manual source-code inspection of every claimed pattern file, plus usage-analysis via cross-reference search to verify integration into the running application.

---

## 1. Executive Summary

| Pattern | Claimed | Java | TypeScript | Actually Integrated | Verdict |
|---|---|:---:|:---:|:---:|:---|
| Service Layer | ✅ | ✅ | ❌ | Java only | **Partial** |
| Factory Method | ✅ | ✅ | ✅ | TS only | **Partial** |
| Template Method | ✅ | ✅ | ✅ | TS only | **Partial** |
| Strategy | ✅ | ✅ | ✅ | TS only | **Partial** |
| Facade | ✅ | ✅ | ✅ | Both | **Full** |
| State | ✅ | ✅ | ❌ | Java only | **Partial** |
| Observer | ✅ | ✅ | ✅ | Both | **Full** |
| Builder | ✅ | ✅ | ❌ | Java only | **Partial** |

**Bottom line:** The README claims 7 patterns are "fully implemented." In reality **only 3 patterns (Facade, Observer, Factory Method/Template Method/Strategy in TypeScript) are live, integrated code.** The Java backend contains well-structured pattern *demonstrations* inside the `pattern/` and `lifecycle/` packages, but several of those classes are **dead code** — they are never instantiated by any Spring controller or service. The TypeScript frontend implements Factory Method, Template Method, and Strategy correctly and integrates them into Next.js API routes, but **State, Builder, and Service Layer are simply not present** in the frontend.

---

## 2. Pattern-by-Pattern Deep Dive

---

### 2.1 Service Layer Pattern

**README claim:** *"Service Layer Pattern - separates business logic from the UI and domain entities."* (User Authentication section)

#### Java Backend

**Files examined:**
- `service/UserService.java` + `UserServiceImpl.java`
- `service/AuditService.java` + `AuditServiceImpl.java`
- `service/AuthService.java` + `AuthServiceImpl.java`
- `service/PatientService.java` + `PatientServiceImpl.java`
- `service/SessionService.java` + `SessionServiceImpl.java`
- `service/DoctorProfileService.java` + `DoctorProfileServiceImpl.java`

**Structure:**
- Every service has a **public interface** and a **concrete `@Service` implementation**.
- Implementations use **constructor dependency injection** (`UserRepository`, `PasswordEncoder`, `JwtUtil`, `AuditService`, etc.).
- Controllers (`AuthController`, `PatientController`, `AdminController`) depend exclusively on service interfaces, never on repositories directly.
- `AuthServiceImpl` additionally delegates to `AuditService` for `login_success`, `login_failed`, and `user_registered` events.

**Integration:**
- `AuthController` → `AuthService`
- `PatientController` → `PatientService`
- `AdminController` → `AdminFacade` → `UserService` / `AuditService`
- `SessionServiceImpl` → `SessionRepository` + `PatientRepository` + `AuditService`

**Verdict:** ✅ **Correctly implemented and fully integrated.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/mock-store.ts`
- `frontend/lib/auth.ts`
- `frontend/lib/audit.ts`
- `frontend/lib/audit-server.ts`

**Structure:**
- The frontend uses **Zustand** for state management and calls Supabase / Spring Boot REST endpoints directly via `fetch()`.
- There is **no Service Layer interface** + implementation structure.
- `mock-store.ts` mixes data access (Supabase queries), HTTP calls (`fetch` to `/api/patients`, `/api/sessions`), and UI state in a single file.
- `auth.ts` configures NextAuth and calls Supabase auth directly.

**Verdict:** ❌ **Not implemented.** The README implies Service Layer is present on the "Java backend," which is true, but the overall project claim of "7 patterns fully implemented" is weakened by the absence of this pattern in the TypeScript tier.

---

### 2.2 Factory Method Pattern

**README claim:** *"Factory Method Pattern - dynamically instantiates the correct template type based on consultation specialty."* (Template-Based Documentation) and *"TranscriptionServiceFactory dynamically creates the correct transcription provider instance."* (AI Pipeline)

#### Java Backend

**Files examined:**
- `pattern/factory/TranscriptionProvider.java`
- `pattern/factory/SarvamTranscriptionProvider.java`
- `pattern/factory/TranscriptionServiceFactory.java`
- `pattern/template/SoapNoteGenerator.java`
- `pattern/template/NoteGeneratorFactory.java`

**Structure:**
- `TranscriptionProvider` is a product interface; `SarvamTranscriptionProvider` is the concrete product. `TranscriptionServiceFactory` is a `@Component` creator with `create()` and `create(String)` methods.
- `NoteGeneratorFactory` is a `@Component` that registers 6 `SoapNoteGenerator` subclasses in a `ConcurrentHashMap` and provides `get(String)` and `templateNames()`.

**Integration:**
- **Cross-reference search (`grep` across all Java sources) found ZERO usages** of `TranscriptionServiceFactory`, `NoteGeneratorFactory`, `TranscriptionProvider`, or `SoapNoteGenerator` outside their own package declarations and the README.
- No Spring controller `@Autowired`s these factories. No service method calls `TranscriptionServiceFactory.create()`.
- The classes are **well-formed but dead code** — they compile but never run in the live application.

**Verdict:** ⚠️ **Structurally correct but not integrated.** The Java backend does not actually use its own Factory Method implementations.

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/transcription-factory.ts`
- `frontend/lib/soap-note-generator.ts`

**Structure:**
- `TranscriptionServiceFactory.create()` returns a `TranscriptionProvider` (currently `SarvamTranscriptionProvider`).
- `NoteGeneratorFactory.get(name)` returns a `SoapNoteGenerator` subclass; defaults to `GeneralOpdNoteGenerator`.

**Integration:**
- `/app/api/transcribe/route.ts` calls `TranscriptionServiceFactory.create()`.
- `/app/api/generate-note/route.ts` calls `NoteGeneratorFactory.get(templateName)` and `NoteGeneratorFactory.templateNames()`.

**Verdict:** ✅ **Correctly implemented and integrated into API routes.**

---

### 2.3 Template Method Pattern

**README claim:** *"Template Method — SoapNoteGenerator defines the fixed SOAP skeleton; each specialty subclass overrides only the sections relevant to its domain."*

#### Java Backend

**Files examined:**
- `pattern/template/SoapNoteGenerator.java`
- `pattern/template/GeneralOpdNoteGenerator.java`
- `pattern/template/CardiologyNoteGenerator.java`
- `pattern/template/PediatricNoteGenerator.java`
- `pattern/template/MentalHealthNoteGenerator.java`
- `pattern/template/PhysiotherapyNoteGenerator.java`
- `pattern/template/SurgicalFollowupNoteGenerator.java`
- `pattern/template/ClaudeAiClient.java`
- `pattern/template/AiClient.java`

**Structure:**
- `SoapNoteGenerator` is an `abstract class` with a `final` template method `generate(String, AiClient)`.
- The template method calls private steps: `callModel()` (builds prompt + calls AI) and `normalizeFields()` (ensures all expected keys exist).
- Subclasses override `getTemplateName()`, `getFields()`, and optionally `specialtyContext()` (hook).
- This is a **textbook Template Method** structure.

**Issues:**
- `ClaudeAiClient` is a **stub** — `generateText(String)` returns a hardcoded JSON string, not a real Claude API call.
- **Zero usages** of `SoapNoteGenerator` or its subclasses found outside the `pattern/template` package.

**Verdict:** ⚠️ **Structurally correct but dead code in the Java backend.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/soap-note-generator.ts`

**Structure:**
- `SoapNoteGenerator` abstract class with `async generate(transcript, client)` template method.
- Private `callModel()` and `normaliseFields()` steps.
- 6 concrete subclasses identical to the Java versions.

**Integration:**
- Used in `/app/api/generate-note/route.ts`.

**Verdict:** ✅ **Correctly implemented and integrated.**

---

### 2.4 Strategy Pattern

**README claim:** *"Strategy Pattern - a common NoteShareStrategy interface with interchangeable EmailShareStrategy, SmsShareStrategy, and WhatsAppShareStrategy implementations."*

#### Java Backend

**Files examined:**
- `pattern/strategy/NotificationStrategy.java`
- `pattern/strategy/EmailNotificationStrategy.java`
- `pattern/strategy/SmsNotificationStrategy.java`
- `pattern/strategy/WhatsAppNotificationStrategy.java`
- `pattern/strategy/NotificationService.java`
- `pattern/strategy/NotificationServiceFactory.java`

**Structure:**
- `NotificationStrategy` interface with `getChannel()`, `fire(NotificationPayload)`, `isAvailable()`.
- 3 concrete `@Component` strategies.
- `NotificationService` is the Context class holding a `List<NotificationStrategy>`.
- `NotificationServiceFactory` builds pre-wired `NotificationService` instances.

**Integration:**
- **Zero usages** outside the `pattern/strategy` package.
- The strategies are marked `@Component` but are also instantiated directly with `new` inside `NotificationServiceFactory`, creating a slight inconsistency (Spring-managed vs manual instantiation).

**Verdict:** ⚠️ **Structurally correct but dead code in Java.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/notifications.ts`

**Structure:**
- `NotificationStrategy` interface with `channel` and `fire(payload)`.
- 3 concrete classes: `EmailNotificationStrategy`, `WhatsAppNotificationStrategy`, `SmsNotificationStrategy`.
- `NotificationService` context class with `register()` and `fire()`.
- `buildDoctorNotificationService(email, phone?)` factory.

**Integration:**
- The sharing dropdown in the prescription UI (described in README FR-09) uses these strategies to open `mailto:`, `wa.me/`, and `sms:` URIs.
- `sendSystemNotification()` is used by `DoctorNotifierObserver` in `consultation-observer.ts`.

**Verdict:** ✅ **Correctly implemented and integrated.**

---

### 2.5 Facade Pattern

**README claim:** *"Facade Pattern - AdminFacade wraps UserService, TemplateService, and AuditService behind a single interface."*

#### Java Backend

**Files examined:**
- `facade/AdminFacade.java`
- `controller/AdminController.java`

**Structure:**
- `AdminFacade` is a `@Component` with constructor-injected `UserService` and `AuditService`.
- Methods: `getAllUsers()`, `getUser()`, `activateUser()`, `deactivateUser()`, `getStats()`, `createUser()`, `getAuditLogs()`.
- Each write method performs the business action **and** logs the audit event atomically through the facade.

**Integration:**
- `AdminController` depends **exclusively** on `AdminFacade`. It never touches `UserService` or `AuditService` directly.

**Verdict:** ✅ **Correctly implemented and fully integrated.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/admin-facade.ts`

**Structure:**
- `AdminFacade` class takes a JWT `token` in its constructor.
- Encapsulates `fetch()` logic (base URL, auth headers, error handling, 204 handling).
- Methods: `getAllUsers()`, `getUser()`, `toggleUserActivation()`, `createUser()`, `getStats()`.

**Integration:**
- Used by admin dashboard pages (implied by README and facade design).

**Verdict:** ✅ **Correctly implemented and integrated.**

---

### 2.6 State Pattern

**README claim:** *"State Pattern — each lifecycle stage is a class; illegal transitions throw checked exceptions."* (Consultation Lifecycle section)

#### Java Backend

**Files examined:**
- `lifecycle/state/ConsultationState.java`
- `lifecycle/state/ScheduledState.java`
- `lifecycle/state/InProgressState.java`
- `lifecycle/state/RecordedState.java`
- `lifecycle/state/TranscribedState.java`
- `lifecycle/state/UnderReviewState.java`
- `lifecycle/state/ApprovedState.java`
- `lifecycle/state/RejectedState.java`
- `lifecycle/state/ConsultationStateFactory.java`
- `lifecycle/state/IllegalStateTransitionException.java`
- `service/SessionServiceImpl.java`

**Structure:**
- `ConsultationState` interface with `statusName()` and `transitionTo(String targetStatus)`.
- 7 concrete state classes, each encapsulating its own legal transitions.
- `ApprovedState.transitionTo()` always throws — terminal state.
- `RejectedState.transitionTo()` only allows `UNDER_REVIEW` — regeneration path.
- `ConsultationStateFactory` maps string status to state instances.

**Integration:**
- `SessionServiceImpl.transitionSession()` calls `ConsultationStateFactory.fromStatus(fromStatus)` then `currentState.transitionTo(targetStatus)`.
- Illegal transitions throw `IllegalStateTransitionException`, which is caught by `GlobalExceptionHandler`.

**Verdict:** ✅ **Correctly implemented and fully integrated.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/session-state-machine.ts`
- `frontend/lib/mock-store.ts`

**Structure:**
- `VALID_TRANSITIONS` is a plain `Record<SessionStatus, SessionStatus[]>` map.
- `canTransition(from, to)` checks inclusion in the array.
- `assertTransition(from, to)` throws `Error` on illegal jumps.
- `transitionSession()` in the Zustand store calls `assertTransition()` before persisting.

**Analysis:**
- This is **NOT the State pattern**. It is a **state-transition validation table** (a guard clause / state machine rule engine).
- The State pattern requires:
  1. A state interface/class that encapsulates behavior *for* that state.
  2. The context object (session) delegates state-specific behavior to the current state object.
- Here, there are **no state classes**, no state-specific behavior, and no delegation. The session object stores a string status and the store validates transitions with a lookup table.
- The README conflates "state machine enforcement" (which exists) with the "State pattern" (which does not exist in TypeScript).

**Verdict:** ❌ **Not implemented.** The frontend has state-transition validation, but not the State design pattern.

---

### 2.7 Observer Pattern

**README claim:** *"Observer Pattern — ConsultationSubject broadcasts lifecycle events; DoctorNotifier, AuditLogger, and DashboardRefresher are registered observers."*

#### Java Backend

**Files examined:**
- `lifecycle/observer/ConsultationObserver.java`
- `lifecycle/observer/ConsultationEventPublisher.java`
- `lifecycle/observer/ConsultationEvent.java`
- `lifecycle/observer/AuditLoggerObserver.java`
- `lifecycle/observer/DoctorNotifierObserver.java`
- `lifecycle/observer/SessionStatusObserver.java`
- `service/SessionServiceImpl.java`

**Structure:**
- `ConsultationObserver` interface with `onEvent(ConsultationEvent)`.
- `ConsultationEventPublisher` maintains a `List<ConsultationObserver>` with `subscribe()`, `unsubscribe()`, `publish()`.
- 3 concrete observers:
  - `AuditLoggerObserver` → logs to `AuditService`
  - `DoctorNotifierObserver` → logs notifications via SLF4J
  - `SessionStatusObserver` → logs lifecycle transitions via SLF4J

**Integration:**
- `SessionServiceImpl` constructor instantiates `ConsultationEventPublisher`, subscribes all 3 observers, and calls `publisher.publish(event)` after every successful state transition in `transitionSession()`.

**Verdict:** ✅ **Correctly implemented and fully integrated.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/consultation-observer.ts`

**Structure:**
- `ConsultationObserver` interface with `onEvent(event, payload)`.
- `ConsultationSubject` with `subscribe()`, `unsubscribe()`, `notify()`.
- 3 concrete observers:
  - `DoctorNotifierObserver` → calls `sendSystemNotification()` for `note_ready`, `note_approved`, `note_rejected`, `transcription_failed`
  - `AuditLoggerObserver` → calls `logAudit()` for auditable events
  - `DashboardRefresherObserver` → calls a refresh callback on `note_approved` / `note_rejected`
- `consultationSubject` singleton exported.

**Integration:**
- Imported and used by components that need to publish or react to consultation lifecycle events.

**Verdict:** ✅ **Correctly implemented and integrated.**

---

### 2.8 Builder Pattern

**README claim:** *"Builder Pattern - PatientProfileBuilder with fluent API and a terminal build() that runs all validations before persisting."*

#### Java Backend

**Files examined:**
- `builder/PatientProfileBuilder.java`
- `builder/PatientProfileValidationException.java`
- `pattern/builder/PatientProfileBuilder.java`
- `pattern/builder/PatientProfile.java`
- `pattern/builder/PatientProfileBuilderService.java`
- `pattern/builder/ChronicCondition.java`
- `pattern/builder/Allergy.java`
- `pattern/builder/EmergencyContact.java`
- `pattern/builder/InsuranceDetails.java`
- `service/PatientServiceImpl.java`
- `controller/PatientController.java`

**Structure (two competing implementations):**

1. **`builder/PatientProfileBuilder`** (the "old" builder):
   - Fluent class with `withName()`, `withDoctorEmail()`, `withChronicConditions()`, etc.
   - Terminal `build()` returns a Hibernate `Patient` entity directly.
   - `validate()` runs inline checks (name length, age range, email regex, ICD-10 regex, emergency contact phone digits).
   - **Used by:** `PatientServiceImpl.createPatient()`.

2. **`pattern/builder/PatientProfileBuilder`** + **`PatientProfile`** (the "new" builder):
   - `PatientProfile` is an immutable value object with a **nested static `Builder` class**.
   - `Builder` has fluent setters for all fields, terminal `build()` with comprehensive validation (required fields, email regex, phone digits, gender enum, ICD-10 codes, emergency contact phone, insurance provider/policy).
   - `PatientProfileBuilder` wraps the nested builder with an alternative fluent API.
   - `PatientProfileBuilderService` is a `@Service` that provides convenience factory methods.
   - Value objects (`ChronicCondition`, `Allergy`, `EmergencyContact`, `InsuranceDetails`) each have their own **nested static `Builder` classes**.

**Integration:**
- The **old** `builder/PatientProfileBuilder` is the one actually wired into the live application via `PatientServiceImpl.createPatient()`.
- The **new** `pattern/builder/` classes are **not used** by any controller or service. `PatientProfileBuilderService` is never instantiated or injected.

**Issues:**
- **Duplication:** Two `PatientProfileBuilder` classes with overlapping intent but different APIs. This is confusing and violates DRY.
- **Dead code:** The more elaborate `pattern/builder/` package (which best demonstrates the pattern with nested builders for value objects) is unused.

**Verdict:** ⚠️ **Builder pattern exists in Java, but the most illustrative implementation is dead code. The live implementation is a simpler single-class builder.**

#### TypeScript Frontend

**Files examined:**
- `frontend/lib/mock-store.ts`

**Structure:**
- Patient objects are constructed as plain JavaScript objects: `{ name, age, gender, email, phone, chronicConditions, allergies, emergencyContact, insuranceDetails }`.
- There is **no Builder class**, **no fluent API**, and **no terminal `build()` validation**.
- The multi-step Add Patient dialog (3 steps) is a **UI workflow**, not a Builder pattern. The data is collected in form state and submitted as a single JSON object.

**Verdict:** ❌ **Not implemented.**

---

## 3. Cross-Cutting Issues

### 3.1 Dead Code in Java `pattern/` Package

Several well-formed pattern demonstrations in the Java backend are never invoked:

| Class / Package | Pattern | Used? | Called By |
|---|---|---|---|
| `pattern.factory.TranscriptionServiceFactory` | Factory Method | ❌ | Nothing |
| `pattern.factory.SarvamTranscriptionProvider` | Factory Method | ❌ | Nothing |
| `pattern.template.NoteGeneratorFactory` | Factory Method | ❌ | Nothing |
| `pattern.template.SoapNoteGenerator` hierarchy | Template Method | ❌ | Nothing |
| `pattern.template.ClaudeAiClient` | Template Method dependency | ❌ | Nothing (stub) |
| `pattern.strategy.NotificationServiceFactory` | Strategy + Factory | ❌ | Nothing |
| `pattern.strategy.NotificationService` | Strategy (Context) | ❌ | Nothing |
| `pattern.builder.PatientProfileBuilderService` | Builder | ❌ | Nothing |
| `pattern.builder.PatientProfile` + nested builders | Builder | ❌ | Nothing |

These classes compile, are documented with Javadoc, and even have UML diagrams in `docs/`, but they contribute **zero runtime behavior** to the application. This is a significant gap between "implemented" and "deployed."

### 3.2 AI Client Stub

`ClaudeAiClient.generateText()` returns a hardcoded JSON string:

```java
return "{\"subjective\": \"Patient reports symptoms...\", ...}";
```

This means the Java Template Method implementation cannot generate real notes even if it were wired up. The TypeScript version (`/app/api/generate-note/route.ts`) uses the real Anthropic SDK.

### 3.3 README Inaccuracies

| README Claim | Reality |
|---|---|
| *"7 patterns fully implemented"* | Only 3 are fully integrated in both tiers; several Java pattern classes are dead code. |
| *"State Pattern — lib/session-state-machine.ts"* | The TS file is a transition map, **not** the State pattern. |
| *"Builder Pattern — Multi-step Add Patient dialog"* | The dialog is a UI flow; there is no Builder in TypeScript. |
| *"Service Layer implemented (Java backend)"* | True for Java, but the overall pattern claim ignores the missing TS side. |
| *"Factory Method fully implemented — NoteGeneratorFactory.get(name) returns the correct SoapNoteGenerator subclass"* | True for TypeScript (`/api/generate-note`). False for Java — the Java `NoteGeneratorFactory` is unused. |

---

## 4. Recommendations

1. **Integrate or remove dead code.** Either wire the Java `pattern/` classes into Spring controllers (e.g., a `/api/java/transcribe` and `/api/java/generate-note` endpoint) or delete them to avoid misleading reviewers.

2. **Consolidate Builder implementations.** Delete the unused `pattern/builder/` duplication or refactor `PatientServiceImpl` to use `PatientProfileBuilderService` + `PatientProfile.Builder`.

3. **Implement real `ClaudeAiClient`.** Replace the stub with an actual REST call to the Anthropic API (or delete the Java Template Method code if the TypeScript implementation is the canonical one).

4. **Clarify State vs. state-machine in README.** Change the TypeScript description from "State Pattern" to "State Transition Validation" or implement actual State classes in TypeScript.

5. **Add Service Layer to TypeScript.** If the project truly wants 7 patterns across the full stack, create `UserService`, `PatientService`, etc. interfaces in TypeScript that abstract Supabase / REST calls, rather than putting all data access in the Zustand store.

6. **Add Builder to TypeScript.** A `PatientBuilder` class with `withName()`, `withChronicCondition()`, and `build()` would align the frontend with the backend claim.

---

## 5. Final Scorecard

| # | Pattern | Java Quality | TS Quality | Integrated | Claim Accurate? |
|---|---------|-------------|------------|------------|-----------------|
| 1 | Service Layer | ⭐⭐⭐⭐⭐ | ⭐☆☆☆☆ | Java only | Partial |
| 2 | Factory Method | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ | TS only | Partial |
| 3 | Template Method | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ | TS only | Partial |
| 4 | Strategy | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ | TS only | Partial |
| 5 | Facade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both | ✅ Yes |
| 6 | State | ⭐⭐⭐⭐⭐ | ⭐☆☆☆☆ | Java only | Partial |
| 7 | Observer | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both | ✅ Yes |
| 8 | Builder | ⭐⭐⭐☆☆ | ⭐☆☆☆☆ | Java only (duplicated) | Partial |

**Patterns truly live across the whole stack:** **2 out of 8** (Facade, Observer).  
**Patterns live in at least one tier with correct structure:** **7 out of 8** (all except State in TypeScript).  
**README claim of "7 patterns fully implemented":** Overstated. Several are demonstrations, not deployed code.
