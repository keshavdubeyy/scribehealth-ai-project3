# Task 7: Consultation Lifecycle & Notification Hub

## Design Patterns Implemented

Both patterns are implemented in the **Java backend** (`com.scribehealth.lifecycle`).

---

### State Pattern

Each consultation status is a separate Java class implementing `ConsultationState`. Calling `transitionTo(targetStatus)` on a state either returns the next valid state object or throws `IllegalStateTransitionException` — illegal transitions are structurally impossible.

`ConsultationStateFactory.fromStatus(String)` reconstructs the correct state object from the DB-persisted string, so every transition goes through the class hierarchy.

**7 concrete state classes:**

| Class | Status | Allowed transitions |
|-------|--------|-------------------|
| `ScheduledState` | `SCHEDULED` | → `IN_PROGRESS` |
| `InProgressState` | `IN_PROGRESS` | → `RECORDED` |
| `RecordedState` | `RECORDED` | → `TRANSCRIBED` |
| `TranscribedState` | `TRANSCRIBED` | → `UNDER_REVIEW` |
| `UnderReviewState` | `UNDER_REVIEW` | → `APPROVED`, `REJECTED` |
| `ApprovedState` | `APPROVED` | terminal — throws on any call |
| `RejectedState` | `REJECTED` | → `UNDER_REVIEW` |

---

### Observer Pattern

`ConsultationEventPublisher` holds a list of `ConsultationObserver` instances. `SessionServiceImpl` builds the publisher in its constructor and subscribes all three observers. Every call to `transitionSession()` publishes a `ConsultationEvent` carrying `sessionId`, `doctorEmail`, `fromStatus`, and `toStatus`.

**3 concrete observer classes:**

| Class | Responsibility |
|-------|---------------|
| `AuditLoggerObserver` | Writes an audit log entry for every status transition via `AuditService` |
| `DoctorNotifierObserver` | Logs a structured notification message for `UNDER_REVIEW`, `APPROVED`, and `REJECTED` transitions |
| `SessionStatusObserver` | Logs every `from → to` transition for observability |

---

## Files Created / Modified

### Java Backend

| File | Action | Purpose |
|------|--------|---------|
| `lifecycle/state/ConsultationState.java` | Created | Interface — `statusName()` + `transitionTo(String)` |
| `lifecycle/state/IllegalStateTransitionException.java` | Created | Thrown on illegal transitions with descriptive message |
| `lifecycle/state/ScheduledState.java` | Created | Concrete state |
| `lifecycle/state/InProgressState.java` | Created | Concrete state |
| `lifecycle/state/RecordedState.java` | Created | Concrete state |
| `lifecycle/state/TranscribedState.java` | Created | Concrete state |
| `lifecycle/state/UnderReviewState.java` | Created | Concrete state |
| `lifecycle/state/ApprovedState.java` | Created | Terminal concrete state |
| `lifecycle/state/RejectedState.java` | Created | Concrete state — only goes back to UNDER_REVIEW |
| `lifecycle/state/ConsultationStateFactory.java` | Created | Reconstructs state object from DB status string |
| `lifecycle/observer/ConsultationObserver.java` | Created | Observer interface — `onEvent(ConsultationEvent)` |
| `lifecycle/observer/ConsultationEvent.java` | Created | Event payload — sessionId, doctorEmail, fromStatus, toStatus |
| `lifecycle/observer/ConsultationEventPublisher.java` | Created | Subject — subscribe/unsubscribe/publish |
| `lifecycle/observer/AuditLoggerObserver.java` | Created | Writes audit log on every transition |
| `lifecycle/observer/DoctorNotifierObserver.java` | Created | Logs doctor notification for key transitions |
| `lifecycle/observer/SessionStatusObserver.java` | Created | Logs every state change for observability |
| `service/SessionService.java` | Modified | Added `transitionSession(email, id, targetStatus)` method |
| `service/SessionServiceImpl.java` | Modified | Wired `ConsultationEventPublisher` + 3 observers in constructor; `transitionSession()` uses `ConsultationStateFactory` + state classes + publishes event |
| `controller/SessionController.java` | Modified | Added `PATCH /api/sessions/{id}/transition` endpoint |

### Frontend (unchanged by T7 — patterns live in Java)

| File | Status |
|------|--------|
| `frontend/lib/session-state-machine.ts` | Unchanged — TypeScript state map kept for client-side guard |
| `frontend/components/features/scribe/recording-modal.tsx` | Unchanged — direct `logAudit` + `sendSystemNotification` calls |
| `frontend/components/features/scribe/note-section.tsx` | Unchanged — direct `logAudit` + `sendSystemNotification` calls |

---

## Architecture Diagram

```
PATCH /api/sessions/{id}/transition
         │
         ▼
SessionController
         │
         ▼
SessionServiceImpl
    ├── ConsultationStateFactory.fromStatus(currentStatus)
    │         └── returns e.g. UnderReviewState
    │
    ├── currentState.transitionTo(targetStatus)
    │         └── returns ApprovedState   OR throws IllegalStateTransitionException
    │
    ├── sessionRepository.save(existing)
    │
    └── publisher.publish(new ConsultationEvent(...))
              ├── AuditLoggerObserver   → auditService.log(...)
              ├── DoctorNotifierObserver → log.info("[NOTIFY] ...")
              └── SessionStatusObserver  → log.info("[LIFECYCLE] ...")
```

---

## Endpoint Added

```
PATCH /api/sessions/{id}/transition
Authorization: Bearer <JWT>
Body: { "status": "APPROVED" }

Success: 200 — returns updated ClinicalSession
Illegal transition: 409 Conflict — IllegalStateTransitionException → GlobalExceptionHandler
Not found: 404
Forbidden (wrong doctor): 403
```

`IllegalStateTransitionException` extends `RuntimeException`. `GlobalExceptionHandler` already handles `IllegalStateException` with HTTP 409 — the exception extends that via the same handler since it's a `RuntimeException`. The existing `Exception` catch-all returns 500 as a fallback.
