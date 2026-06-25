-- ÚNA · Schema SQL
-- Ejecuta esto en el editor SQL de tu proyecto Supabase.

create extension if not exists "uuid-ossp";

-- ─── Retreats ──────────────────────────────────────────────────────────────
create table public.retreats (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  description   text,
  location      text,
  start_date    date,
  end_date      date,
  capacity      integer not null default 20,
  price         numeric(10, 2) not null default 0,
  currency      text not null default 'USD',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Applications ──────────────────────────────────────────────────────────
create table public.applications (
  id                      uuid primary key default uuid_generate_v4(),
  retreat_id              uuid references public.retreats(id) on delete cascade,
  name                    text not null,
  email                   text not null,
  country                 text,
  profession              text,
  why_attend              text,
  how_heard               text,
  social_media            text,
  status                  text not null default 'pending'
                            check (status in ('pending', 'approved', 'rejected')),
  access_code             text unique,
  access_code_expires_at  timestamptz,
  access_code_email_sent  boolean not null default false,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────
alter table public.retreats enable row level security;
alter table public.applications enable row level security;

-- Authenticated users (admins) can read/write everything
create policy "admin_all_retreats" on public.retreats
  for all using (auth.role() = 'authenticated');

create policy "admin_all_applications" on public.applications
  for all using (auth.role() = 'authenticated');

-- Public: read active retreats (for /aplicar/[slug])
create policy "public_read_active_retreats" on public.retreats
  for select using (is_active = true);

-- Public: create applications
create policy "public_insert_applications" on public.applications
  for insert with check (true);

-- ─── Sample retreat (optional, delete before production) ───────────────────
-- insert into public.retreats (slug, name, description, location, start_date, end_date, capacity, price, currency)
-- values (
--   'amazonia-2026',
--   'Amazonía · Retiro de silencio',
--   'Un encuentro íntimo de cinco días en el corazón de la selva amazónica.',
--   'Colombia',
--   '2026-09-10',
--   '2026-09-15',
--   12,
--   2200.00,
--   'USD'
-- );
