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

-- prescription templates (one row per user, upserted on save)
create table if not exists prescription_templates (
  user_email   text        primary key,
  image_url    text        not null,
  safe_zone    jsonb       not null,
  font_size    integer     not null,
  line_height  real        not null,
  updated_at   timestamptz not null default now()
);

-- Indexes
create index if not exists idx_patients_user_email  on patients(user_email);
create index if not exists idx_sessions_patient_id  on sessions(patient_id);
create index if not exists idx_sessions_user_email  on sessions(user_email);

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
