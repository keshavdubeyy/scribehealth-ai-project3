# Patient Profile Builder — Implementation Notes

> **Branch:** P3-8  
> **Feature:** Task 8 — Patient Profile Builder (Builder Design Pattern)  
> **Status:** In Progress  

---

## Why this feature exists

The existing patient model was a flat record: name, age, gender, email, phone. That is enough to
identify a patient but not enough to support safe clinical care. Doctors need to know chronic
conditions, active allergies (with severity so they can dose safely), who to call in an emergency,
and whether the patient's insurance covers a given treatment. Without these, the "patient record"
is more of a contact card than a medical profile.

The second reason is architectural. The project specifies that at least five design patterns must
be **formally** implemented as a class hierarchy — not just conceptually present. The Builder
pattern was required for this subsystem: a `PatientProfileBuilder` with a fluent API (method
chaining) and a terminal `build()` that runs all validations before any data reaches the database.
Previously, patients were created with a single `supabase.insert()` call — no validation, no
staged construction, no guarantee the object was coherent before it was persisted.

---

## What the Builder pattern means here

The Gang of Four Builder separates the **construction** of a complex object from its
**representation**. In this context:

- The **Director** is whoever calls the builder (the API route, the store action).
- The **Builder** is `PatientProfileBuilder` — it accumulates optional parts step by step.
- The **Product** is a fully-validated `PatientProfile` object ready to be inserted into the DB.

The fluent API makes the construction readable:

```ts
const profile = new PatientProfileBuilder("John Doe", 34, "Male")
  .withEmail("john@example.com")
  .withPhone("+91 98765 43210")
  .withChronicConditions([{ name: "Type 2 Diabetes", icdCode: "E11", diagnosedYear: 2019 }])
  .withAllergies([{ substance: "Penicillin", severity: "severe", reaction: "Anaphylaxis" }])
  .withEmergencyContact({ name: "Jane Doe", relationship: "Spouse", phone: "+91 98765 00000" })
  .withInsurance({ provider: "Star Health", policyNumber: "SH123456", validUntil: "2027-03-31" })
  .build()
```

The `build()` method runs validations and throws a typed `PatientProfileValidationError` if any
constraint is violated. Nothing reaches the DB unless `build()` succeeds.

---

## Data model changes

### New columns on the `patients` table

| Column | Type | Purpose |
|---|---|---|
| `chronic_conditions` | `jsonb` | Array of `{ name, icd_code?, diagnosed_year? }` |
| `allergies` | `jsonb` | Array of `{ substance, severity, reaction? }` — severity: mild/moderate/severe |
| `emergency_contact` | `jsonb` | Single object `{ name, relationship?, phone }` |
| `insurance_details` | `jsonb` | Single object `{ provider, policy_number, valid_until? }` |

All four columns are nullable — existing patients are unaffected and the migration is safe to run
on a live database.

### Why JSONB not separate tables?

A relational model (separate `patient_allergies`, `patient_conditions` tables) would be correct
for a production system with complex queries. For this scope — where we read the full profile at
once and never filter by, say, ICD code — JSONB gives us typed, structured data without the join
overhead or the schema migration complexity of multiple FK tables. The builder still validates the
shape of each nested object before persisting.

---

## File inventory

| File | Layer | What it does |
|---|---|---|
| `frontend/supabase/schema.sql` | DB | Adds 4 new nullable JSONB columns + migration helpers |
| `frontend/lib/types/index.ts` | Types | `ChronicCondition`, `Allergy`, `EmergencyContact`, `InsuranceDetails`, updated `Patient` |
| `frontend/lib/patient-profile-builder.ts` | Builder | `PatientProfileBuilder` class — fluent API + `build()` |
| `frontend/lib/mock-store.ts` | State | `Patient` interface extended; `fetchPatients`, `addPatient`, `updatePatient` updated |
| `frontend/app/api/patients/route.ts` | API | POST accepts all new fields and uses the builder |
| `frontend/app/api/patients/[id]/route.ts` | API | PATCH for editing profile after creation |
| `frontend/components/features/patients/add-patient-dialog.tsx` | UI | Multi-step dialog: Basic → Medical History → Emergency & Insurance |
| `frontend/components/features/patients/patient-profile-card.tsx` | UI | Read-only profile card shown on the patient detail page |
| `frontend/app/(dashboard)/patients/page.tsx` | UI | Swaps inline form for the new `AddPatientDialog` component |
| `frontend/app/(dashboard)/patients/[patientId]/page.tsx` | UI | Adds `PatientProfileCard` below patient header |
| `backend/java/.../model/Patient.java` | Java | Four new `@Column` fields mapped to the new DB columns |
| `backend/java/.../builder/PatientProfileBuilder.java` | Java | Java Builder implementation — same guarantees as the TS one |
| `backend/java/.../controller/PatientController.java` | Java | Uses `PatientProfileBuilder` in the create endpoint |

---

## Validation rules enforced by `build()`

| Rule | Thrown when |
|---|---|
| Name must be non-empty and ≤ 100 chars | `name.trim().length === 0` or `> 100` |
| Age must be 0–150 | `age < 0` or `age > 150` |
| Gender must be non-empty | `gender.trim().length === 0` |
| Email, if provided, must be valid format | fails basic RFC regex |
| Phone, if provided, must contain ≥ 7 digits | strip non-digits, check length |
| Chronic condition name non-empty | `name.trim() === ""` on any entry |
| ICD code, if provided, matches pattern | `[A-Z][0-9]{2}(\.[0-9]+)?` |
| Allergy substance non-empty | `substance.trim() === ""` |
| Allergy severity must be mild/moderate/severe | enum check |
| Emergency contact name and phone required | both must be non-empty strings |
| Emergency contact phone must have ≥ 7 digits | strip non-digits, check length |
| Insurance provider and policy number required | both non-empty |

---

## Multi-step form design

The "Add Patient" dialog is split into three steps to avoid overwhelming the doctor with a single
long form. Medical data entry is high-stakes — a long form increases the risk of skipping fields
or making errors. Short steps with clear labels reduce cognitive load.

**Step 1 — Basic Info**  
Name, age, gender, email, phone. Required fields here block progression to step 2.

**Step 2 — Medical History (optional)**  
Chronic conditions (add multiple via tag input, with optional ICD code) and allergies (substance +
severity dropdown + optional reaction description). This step is optional — a doctor can skip it
and add this information later through the profile edit view.

**Step 3 — Emergency & Insurance (optional)**  
Emergency contact (name, relationship, phone) and insurance (provider, policy number, valid until
date). Also optional, designed to be filled in when the information is available.

The builder is called at the end of step 3 (or whenever the doctor submits) and the validation
errors surface as inline form messages rather than as thrown exceptions in the UI layer.

---

## Java implementation rationale

The Java backend already has `Patient.java` as a JPA entity. The Builder is implemented as a
separate `PatientProfileBuilder.java` class in a `builder/` package. This follows the classic
GoF approach: the builder is a separate class (not a static inner class) so it can be injected or
tested independently. The `build()` method returns a `Patient` entity ready for
`patientRepository.save()`.

The Java builder mirrors the TypeScript one in terms of validation rules, ensuring both entry
points (Next.js API route and Java Spring Boot endpoint) enforce the same invariants.

---

## Decisions log

| Decision | Alternatives considered | Reason chosen |
|---|---|---|
| JSONB for nested fields | Separate relational tables | Simpler schema; full profile always read at once; no need to JOIN |
| Multi-step dialog (3 steps) | Single long form | Reduces cognitive load; step 1 (required) vs steps 2-3 (optional) mirrors clinical intake flow |
| Builder as a standalone class file | Static inner class on Patient | Easier to test in isolation; visible as a named artifact for the pattern requirement |
| Validation in `build()` throws typed error | Validate in form handlers | Single source of truth; same rules apply whether creation comes from UI, API, or Java backend |
| All new columns nullable | NOT NULL with defaults | Non-breaking migration on live data; existing patients remain valid |
