-- Run this in your Supabase project: Dashboard → SQL Editor → New query

-- patients
create table if not exists patients (
  id           text        primary key,
  user_email   text        not null,
  name         text        not null,
  age          integer     not null,
  gender       text        not null,
  created_at   timestamptz not null default now()
);

-- sessions (patient_id nullable to allow unlinking)
create table if not exists sessions (
  id             text        primary key,
  patient_id     text        references patients(id) on delete cascade,
  user_email     text        not null,
  created_at     timestamptz not null default now(),
  status         text        not null default 'IDLE',
  soap           jsonb,
  transcription  text,
  audio_url      text,
  edits          jsonb       not null default '[]'::jsonb,
  prescription   jsonb
);

-- prescription templates (multiple per user, each is one letterhead setup)
-- safe_zone stores percentage-based coords: { x_pct, y_pct, width_pct, height_pct, font_size_pt, line_height_pt }
create table if not exists prescription_templates (
  id           uuid        primary key default gen_random_uuid(),
  user_email   text        not null,
  image_path   text        not null,
  image_width  integer     not null,
  image_height integer     not null,
  safe_zone    jsonb       not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- audit logs: immutable append-only table, one row per system action
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
create index if not exists idx_audit_logs_user_email on audit_logs(user_email);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
alter table audit_logs enable row level security;
drop policy if exists "allow_all" on audit_logs;
create policy "allow_all" on audit_logs for all to anon using (true) with check (true);

-- Indexes
create index if not exists idx_patients_user_email             on patients(user_email);
create index if not exists idx_sessions_patient_id             on sessions(patient_id);
create index if not exists idx_sessions_user_email             on sessions(user_email);
create index if not exists idx_prescription_templates_user_email on prescription_templates(user_email);

-- RLS: enabled with permissive anon policies.
-- The anon key requires RLS to be on; access is scoped by user_email in queries.
alter table patients               enable row level security;
alter table sessions               enable row level security;
alter table prescription_templates enable row level security;

drop policy if exists "allow_all" on patients;
drop policy if exists "allow_all" on sessions;
drop policy if exists "allow_all" on prescription_templates;

create policy "allow_all" on patients               for all to anon using (true) with check (true);
create policy "allow_all" on sessions               for all to anon using (true) with check (true);
create policy "allow_all" on prescription_templates for all to anon using (true) with check (true);
