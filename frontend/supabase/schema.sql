-- Run this in your Supabase project: Dashboard → SQL Editor → New query

-- patients
create table if not exists patients (
  id            text        primary key,
  doctor_email  text        not null,         -- the doctor who owns this patient record
  name          text        not null,
  age           integer     not null,
  gender        text        not null,
  email         text,                         -- optional: patient email for FR-09 note sharing
  phone         text,                         -- optional: patient phone for FR-09 WhatsApp/SMS
  created_at    timestamptz not null default now()
);

-- Migration for existing deployments:
-- alter table patients rename column user_email to doctor_email;
-- alter table patients add column if not exists email text;
-- alter table patients add column if not exists phone text;

-- sessions (patient_id nullable to allow unlinking)
create table if not exists sessions (
  id             text        primary key,
  patient_id     text        references patients(id) on delete cascade,
  doctor_email   text        not null,        -- the doctor who owns this session
  created_at     timestamptz not null default now(),
  status         text        not null default 'SCHEDULED',
  soap           jsonb,
  transcription  text,
  audio_url      text,
  edits          jsonb       not null default '[]'::jsonb,
  prescription   jsonb,
  entities       jsonb
);

-- Migration for existing deployments:
-- alter table sessions rename column user_email to doctor_email;

-- prescription templates (one per doctor, stores letterhead image + safe zone config)
-- safe_zone stores percentage-based coords: { x_pct, y_pct, width_pct, height_pct, font_size_pt, line_height_pt }
create table if not exists prescription_templates (
  id            uuid        primary key default gen_random_uuid(),
  doctor_email  text        not null,
  image_path    text        not null,
  image_width   integer     not null,
  image_height  integer     not null,
  safe_zone     jsonb       not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Migration for existing deployments:
-- alter table prescription_templates rename column user_email to doctor_email;

-- audit logs: immutable append-only table, one row per system action
-- user_email here is the actor (doctor or admin) — intentionally kept as user_email
create table if not exists audit_logs (
  id           uuid        primary key default gen_random_uuid(),
  user_email   text        not null,
  action       text        not null,
  entity_type  text        not null,
  entity_id    text        not null,
  metadata     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- Indexes
create index if not exists idx_patients_doctor_email               on patients(doctor_email);
create index if not exists idx_sessions_patient_id                 on sessions(patient_id);
create index if not exists idx_sessions_doctor_email               on sessions(doctor_email);
create index if not exists idx_prescription_templates_doctor_email on prescription_templates(doctor_email);
create index if not exists idx_audit_logs_user_email               on audit_logs(user_email);
create index if not exists idx_audit_logs_created_at               on audit_logs(created_at desc);

-- RLS: enabled with permissive anon policies.
-- Access is scoped by doctor_email in application queries.
alter table patients               enable row level security;
alter table sessions               enable row level security;
alter table prescription_templates enable row level security;
alter table audit_logs             enable row level security;

drop policy if exists "allow_all" on patients;
drop policy if exists "allow_all" on sessions;
drop policy if exists "allow_all" on prescription_templates;
drop policy if exists "allow_all" on audit_logs;

create policy "allow_all" on patients               for all to anon using (true) with check (true);
create policy "allow_all" on sessions               for all to anon using (true) with check (true);
create policy "allow_all" on prescription_templates for all to anon using (true) with check (true);
create policy "allow_all" on audit_logs             for all to anon using (true) with check (true);
