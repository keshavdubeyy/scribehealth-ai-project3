# Task 7: Consultation Lifecycle & Notification Hub

## Design Patterns Implemented

### State Pattern
The consultation lifecycle enforces a strict sequence of status transitions. Each status is a named state, and the `assertTransition()` function blocks any jump that isn't in `VALID_TRANSITIONS`. The `APPROVED` state is terminal — no further changes are possible once reached. `REJECTED` can only go back to `UNDER_REVIEW` for regeneration.

### Observer Pattern
A `ConsultationSubject` holds a list of observers. Whenever a significant lifecycle event occurs — session created, note approved, note rejected, transcription failed, note ready — the subject's `notify()` method fans the event out to every registered observer. Components register their observers on mount and clean them up on unmount via the `useEffect` return.

Three concrete observer classes:
- **`DoctorNotifierObserver`** — fires a system notification to the doctor's email via `/api/notify` for `note_approved`, `note_rejected`, and `transcription_failed` events
- **`AuditLoggerObserver`** — writes an audit log entry for `session_created`, `note_approved`, `note_rejected`, and `transcription_failed` events
- **`DashboardRefresherObserver`** — calls `router.refresh()` when `note_approved` or `note_rejected` fires so the UI reflects the new status immediately

---

## Files Changed

| File | Change | Why |
|------|--------|-----|
| `frontend/lib/consultation-observer.ts` | Created | Core Observer pattern — `ConsultationEvent` type union, `ConsultationObserver` interface, `ConsultationSubject` class, three concrete observer classes, and the exported `consultationSubject` singleton |
| `frontend/components/features/scribe/recording-modal.tsx` | Modified | Replaced direct `logAudit("session_created")` + `sendSystemNotification()` calls with `consultationSubject.notify()`; added `useEffect` to register `DoctorNotifierObserver` and `AuditLoggerObserver` on mount |
| `frontend/components/features/scribe/note-section.tsx` | Modified | Replaced direct `logAudit("note_approved")` + `sendSystemNotification()` and `logAudit("note_rejected")` calls with `consultationSubject.notify()`; added `useEffect` to register all three observers; added `note_ready` event dispatch on manual note generation |
| `README.md` | Modified | Updated Task 7 status from ⚠️ to ✅; updated Observer pattern row in design patterns table; updated subsystem and overall scores; updated design patterns description |

---

## Architecture Diagram

```
recording-modal.tsx
note-section.tsx
       │
       │  consultationSubject.notify(event, payload)
       ▼
ConsultationSubject
  ├── DoctorNotifierObserver  → sendSystemNotification() → /api/notify → audit_logs
  ├── AuditLoggerObserver     → logAudit()               → audit_logs
  └── DashboardRefresherObserver → router.refresh()
```

---

## Events and Observers

| Event | DoctorNotifier | AuditLogger | DashboardRefresher |
|-------|---------------|-------------|-------------------|
| `session_created` | — | ✅ writes audit | — |
| `transcription_failed` | ✅ notifies doctor | ✅ writes audit | — |
| `note_ready` | — | — | — |
| `note_approved` | ✅ notifies doctor | ✅ writes audit | ✅ refreshes UI |
| `note_rejected` | ✅ notifies doctor | ✅ writes audit | ✅ refreshes UI |

---

## What Was There Before

Notifications and audit logging were scattered as imperative calls at individual call sites inside `recording-modal.tsx` and `note-section.tsx`. Each component independently called `sendSystemNotification()` and `logAudit()` with no central dispatch point. Adding a new observer (e.g. a Slack notifier or an analytics tracker) would have required modifying every component.

## What Changed

All event handling is now centralised through the `consultationSubject` singleton. Adding a new observer requires only creating a class that implements `ConsultationObserver` and calling `consultationSubject.subscribe()` — no existing component code changes needed.

---

## State Machine Reference (unchanged)

File: `frontend/lib/session-state-machine.ts`

```
SCHEDULED    → IN_PROGRESS
IN_PROGRESS  → RECORDED
RECORDED     → TRANSCRIBED
TRANSCRIBED  → UNDER_REVIEW
UNDER_REVIEW → APPROVED | REJECTED
APPROVED     → (terminal)
REJECTED     → UNDER_REVIEW
```

`assertTransition(from, to)` throws `Error` on any transition not in this map.
