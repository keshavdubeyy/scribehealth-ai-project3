-- Patient profile extension for persistent history fields.
-- This keeps patient-level allergy/chronic-condition history separate from
-- per-session extracted entities JSON.

alter table if exists public.patients
  add column if not exists created_by_doctor_email text,
  add column if not exists chronic_conditions jsonb not null default '[]'::jsonb,
  add column if not exists allergies jsonb not null default '[]'::jsonb,
  add column if not exists emergency_contact jsonb,
  add column if not exists insurance_details jsonb;

-- Optional indexes for doctor-scoped access and JSONB filtering.
create index if not exists idx_patients_created_by_doctor_email
  on public.patients (created_by_doctor_email);

create index if not exists idx_patients_chronic_conditions_gin
  on public.patients using gin (chronic_conditions);

create index if not exists idx_patients_allergies_gin
  on public.patients using gin (allergies);
