# Task 1 — User Authentication & Role-Based Access

## Overview

Task 1 establishes the security foundation of ScribeHealth AI. In a healthcare system, data isolation is not optional — a doctor must only ever see their own patients, and an administrator must never be able to create or modify clinical records. This task implements:

- Secure login and registration with JWT tokens
- Role-based access control (RBAC) for DOCTOR and ADMIN roles
- Doctor-scoped patient and session data (ownership enforcement)
- Full wiring of the frontend to the real backend API

---

## Design Pattern — Service Layer

The **Service Layer** pattern separates business logic from the presentation layer (controllers) and the data layer (repositories). It is the architectural backbone of Task 1.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│           NextAuth + Zustand Store (API calls)          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + JWT Bearer Token
┌────────────────────────▼────────────────────────────────┐
│              Controller Layer (Spring Boot)             │
│         AuthController / PatientController /            │
│         SessionController / AdminController             │
└────────────────────────┬────────────────────────────────┘
                         │ delegates to
┌────────────────────────▼────────────────────────────────┐
│               Service Layer  ◄── Design Pattern         │
│                                                         │
│   «interface»          «implementation»                 │
│   AuthService    ───►  AuthServiceImpl                  │
│                                                         │
│   - login()            - validates credentials          │
│   - register()         - encodes passwords (BCrypt)     │
│   - getCurrentUser()   - generates JWT token            │
└────────────────────────┬────────────────────────────────┘
                         │ reads/writes
┌────────────────────────▼────────────────────────────────┐
│              Repository Layer (MongoDB)                 │
│    UserRepository / PatientRepository / SessionRepo     │
└─────────────────────────────────────────────────────────┘
```

**Why Service Layer here?**
- `AuthService` is an interface — the controller never depends on the concrete `AuthServiceImpl`
- Business rules (account-disabled check, duplicate email check, token generation) live in the service, not the controller
- The service can be swapped, mocked in tests, or extended without touching controllers

---

## JWT Authentication Flow

```
User submits credentials
        │
        ▼
POST /api/auth/login
        │
        ▼
AuthServiceImpl.login()
  ├── find user by email
  ├── check account is active
  ├── verify BCrypt password
  └── generate JWT (email + role + userId, 8h expiry)
        │
        ▼
Frontend receives { token, name, email, role }
        │
        ▼
NextAuth stores token in session (session.user.accessToken)
        │
        ▼
Every subsequent request:
  Authorization: Bearer <token>
        │
        ▼
JwtAuthFilter (Spring Security)
  ├── extract token from Authorization header
  ├── validate signature + expiry
  ├── extract email + role
  └── set SecurityContext Authentication
        │
        ▼
Controller reads SecurityContextHolder
  └── resolves to current User via UserRepository
```

---

## Role Matrix

| Action | DOCTOR | ADMIN |
|--------|--------|-------|
| View own patients | ✅ | ❌ |
| Create patient | ✅ | ❌ |
| Delete own patient | ✅ | ❌ |
| View own sessions | ✅ | ❌ |
| Create / update session | ✅ | ❌ |
| View all users | ❌ | ✅ |
| Activate / deactivate users | ❌ | ✅ |
| View system stats | ❌ | ✅ |
| Update own doctor profile | ✅ | ❌ |

---

## Files Changed

| File | Change |
|------|--------|
| `backend/.../model/ClinicalSession.java` | Added `doctorId` field with getter/setter |
| `backend/.../repository/SessionRepository.java` | Added `findByPatientIdAndDoctorId()` query method |
| `backend/.../config/SecurityConfig.java` | Enforced authentication on all routes; added ADMIN/DOCTOR role rules; removed unsafe CORS origin |
| `backend/.../controller/PatientController.java` | Scoped all operations to the authenticated doctor; added `GET /{id}` with ownership check; removed `@CrossOrigin` |
| `backend/.../controller/SessionController.java` | Auto-sets `doctorId` on create; ownership checks on update and delete; scoped GET to doctor |
| `frontend/lib/mock-store.ts` | Replaced all local no-op operations with real authenticated API calls using JWT from NextAuth session |

---

## API Endpoints After Task 1

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | `/api/auth/login` | No | Any |
| POST | `/api/auth/register` | No | Any |
| GET | `/api/auth/me` | Yes | Any |
| GET | `/api/patients` | Yes | DOCTOR (own patients only) |
| POST | `/api/patients` | Yes | DOCTOR |
| GET | `/api/patients/{id}` | Yes | DOCTOR (own only) |
| DELETE | `/api/patients/{id}` | Yes | DOCTOR (own only) |
| GET | `/api/sessions/patient/{id}` | Yes | DOCTOR (own only) |
| POST | `/api/sessions` | Yes | DOCTOR |
| PUT | `/api/sessions/{id}` | Yes | DOCTOR (own only) |
| DELETE | `/api/sessions/{id}` | Yes | DOCTOR (own only) |
| GET | `/api/admin/users` | Yes | ADMIN only |
| PATCH | `/api/admin/users/{id}/activate` | Yes | ADMIN only |
| PATCH | `/api/admin/users/{id}/deactivate` | Yes | ADMIN only |
| GET | `/api/admin/stats` | Yes | ADMIN only |
| GET | `/api/doctor/profile` | Yes | DOCTOR only |
| PATCH | `/api/doctor/profile` | Yes | DOCTOR only |

---

## Ownership Enforcement

Patients and sessions are always scoped to the logged-in doctor:

- `GET /api/patients` returns only patients where `patient.doctorId == currentUser.id`
- `POST /api/patients` automatically sets `patient.doctorId = currentUser.id` (frontend cannot override)
- `DELETE /api/patients/{id}` returns **403 Forbidden** if the patient belongs to a different doctor
- `POST /api/sessions` automatically sets `session.doctorId = currentUser.id`
- `GET /api/sessions/patient/{patientId}` returns only sessions matching both `patientId` AND `doctorId`
- `PUT` and `DELETE` on sessions return **403** for cross-doctor access attempts

---

## How to Test

### 1. Start the system
```bash
cd backend/java && ./mvnw spring-boot:run
cd frontend && npm run dev
```

### 2. Register two doctors
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr Alpha","email":"alpha@test.com","password":"pass123","role":"DOCTOR"}'

curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr Beta","email":"beta@test.com","password":"pass123","role":"DOCTOR"}'
```

### 3. Verify isolation
- Log in as Dr Alpha → create a patient → note the patient ID
- Log in as Dr Beta → `GET /api/patients` → Dr Alpha's patient must not appear
- Dr Beta attempts `DELETE /api/patients/<alpha-patient-id>` → expect **403**

### 4. Verify unauthenticated access is blocked
```bash
curl http://localhost:8081/api/patients
```
Expected: **401 Unauthorized**

### 5. Verify role enforcement
- Log in as ADMIN → attempt `GET /api/patients` → expect **403 Forbidden**
- Log in as DOCTOR → attempt `GET /api/admin/users` → expect **403 Forbidden**
