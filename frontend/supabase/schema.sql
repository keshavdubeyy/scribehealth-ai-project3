-- Run this in your Supabase project: Dashboard → SQL Editor → New query

-- ─────────────────────────────────────────────────────────────────
-- organizations: top-level tenant boundary (clinic / hospital)
-- ─────────────────────────────────────────────────────────────────
create table if not exists organizations (
  id           text        primary key default gen_random_uuid()::text,
  name         text        not null unique,
  type         text        not null default 'clinic',  -- clinic | hospital | solo_practice
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- patients
create table if not exists patients (
  id                  text        primary key,
  doctor_email        text        not null,
  organization_id     text        references organizations(id) on delete set null,
  name                text        not null,
  age                 integer     not null,
  gender              text        not null,
  email               text,
  phone               text,
  -- Patient Profile Builder fields (Task 8)
  chronic_conditions  jsonb,      -- [{ name, icd_code?, diagnosed_year? }]
  allergies           jsonb,      -- [{ substance, severity, reaction? }]
  emergency_contact   jsonb,      -- { name, relationship?, phone }
  insurance_details   jsonb,      -- { provider, policy_number, valid_until? }
  created_at          timestamptz not null default now()
);

-- Migration for existing deployments:
-- alter table patients rename column user_email to doctor_email;
-- alter table patients add column if not exists email text;
-- alter table patients add column if not exists phone text;

-- sessions (patient_id nullable to allow unlinking)
create table if not exists sessions (
  id               text        primary key,
  patient_id       text        references patients(id) on delete cascade,
  doctor_email     text        not null,
  organization_id  text        references organizations(id) on delete set null,
  created_at       timestamptz not null default now(),
  status           text        not null default 'SCHEDULED',
  soap             jsonb,
  transcription    text,
  audio_url        text,
  edits            jsonb       not null default '[]'::jsonb,
  prescription     jsonb,
  entities         jsonb
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

-- ─────────────────────────────────────────────────────────────────
-- profiles: manages doctor and admin identities
-- ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  email            text        primary key,
  name             text        not null,
  role             text        not null default 'DOCTOR', -- DOCTOR | ADMIN
  organization_id  text        references organizations(id) on delete set null,
  specialization   text,
  license_number   text,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  -- used by the Java/Spring backend for its own BCrypt auth (nullable — Supabase Auth users leave this null)
  password_hash    text,
  last_login_at    timestamptz
);

-- ─────────────────────────────────────────────────────────────────
-- invites: manages registration tokens for new staff
-- ─────────────────────────────────────────────────────────────────
create table if not exists invites (
  email            text        primary key,
  organization_id  text        references organizations(id) on delete cascade,
  role             text        not null default 'DOCTOR',
  status           text        not null default 'PENDING', -- PENDING | USED | EXPIRED
  created_at       timestamptz not null default now()
);

-- Migration helpers for existing deployments (must run before indexes below):
alter table patients add column if not exists organization_id    text references organizations(id) on delete set null;
alter table sessions add column if not exists organization_id    text references organizations(id) on delete set null;
-- Patient Profile Builder columns (Task 8 — safe to run on live data, all nullable):
alter table patients add column if not exists chronic_conditions jsonb;
alter table patients add column if not exists allergies          jsonb;
alter table patients add column if not exists emergency_contact  jsonb;
alter table patients add column if not exists insurance_details  jsonb;

-- Indexes
create index if not exists idx_organizations_is_active             on organizations(is_active);
create index if not exists idx_patients_doctor_email               on patients(doctor_email);
create index if not exists idx_patients_organization_id            on patients(organization_id);
create index if not exists idx_patients_allergies                  on patients using gin(allergies);
create index if not exists idx_patients_chronic_conditions         on patients using gin(chronic_conditions);
create index if not exists idx_sessions_patient_id                 on sessions(patient_id);
create index if not exists idx_sessions_doctor_email               on sessions(doctor_email);
create index if not exists idx_sessions_organization_id            on sessions(organization_id);
create index if not exists idx_prescription_templates_doctor_email on prescription_templates(doctor_email);
create index if not exists idx_audit_logs_user_email               on audit_logs(user_email);
create index if not exists idx_audit_logs_created_at               on audit_logs(created_at desc);

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security
-- The service-role key (used in server-side API routes) bypasses
-- RLS entirely. The anon key (used in client components) is
-- restricted to the policies below.
-- ─────────────────────────────────────────────────────────────────
alter table organizations          enable row level security;
alter table patients               enable row level security;
alter table sessions               enable row level security;
alter table prescription_templates enable row level security;
alter table audit_logs             enable row level security;

-- Drop old policies to ensure idempotency
drop policy if exists "allow_all" on organizations;
drop policy if exists "allow_all" on patients;
drop policy if exists "allow_all" on sessions;
drop policy if exists "allow_all" on prescription_templates;
drop policy if exists "allow_all" on audit_logs;

drop policy if exists "orgs_read" on organizations;
drop policy if exists "profiles_read_own" on profiles;
drop policy if exists "invites_read_org" on invites;
drop policy if exists "invites_insert_anon" on invites;
drop policy if exists "invites_update_anon" on invites;
drop policy if exists "patients_doctor_owns" on patients;
drop policy if exists "sessions_doctor_owns" on sessions;
drop policy if exists "templates_doctor_owns" on prescription_templates;
drop policy if exists "audit_insert" on audit_logs;
drop policy if exists "audit_read_own" on audit_logs;

-- Row Level Security
alter table organizations          enable row level security;
alter table profiles               enable row level security;
alter table invites                enable row level security;
alter table patients               enable row level security;
alter table sessions               enable row level security;
alter table prescription_templates enable row level security;
alter table audit_logs             enable row level security;

-- Policies
create policy "orgs_read" on organizations for select to anon using (is_active = true);

create policy "profiles_read_own" on profiles
  for select to anon
  using (email = current_setting('app.current_user_email', true) or organization_id = current_setting('app.current_org_id', true));

create policy "invites_read_org" on invites
  for select to anon
  using (organization_id = current_setting('app.current_org_id', true));

create policy "invites_insert_anon" on invites for insert to anon with check (true);
create policy "invites_update_anon" on invites for update to anon using (true) with check (true);

create policy "patients_doctor_owns" on patients
  for all to anon
  using (doctor_email = current_setting('app.current_user_email', true) or organization_id = current_setting('app.current_org_id', true))
  with check (doctor_email = current_setting('app.current_user_email', true));

create policy "sessions_doctor_owns" on sessions
  for all to anon
  using (doctor_email = current_setting('app.current_user_email', true) or organization_id = current_setting('app.current_org_id', true))
  with check (doctor_email = current_setting('app.current_user_email', true));

create policy "templates_doctor_owns" on prescription_templates
  for all to anon
  using (doctor_email = current_setting('app.current_user_email', true))
  with check (doctor_email = current_setting('app.current_user_email', true));

create policy "audit_insert" on audit_logs for insert to anon with check (true);
create policy "audit_read_own" on audit_logs
  for select to anon

-- Enable Realtime
alter publication supabase_realtime add table audit_logs;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table sessions;
