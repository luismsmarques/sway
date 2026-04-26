-- Solo-Flow initial database schema (Sprint 1)
-- PostgreSQL / Supabase compatible

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'template_type') then
    create type template_type as enum ('PRIVATE', 'GROUP');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('PENDING', 'CONFIRMED', 'CANCELED');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  avatar_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  type template_type not null,
  duration_mins integer not null check (duration_mins > 0),
  capacity integer not null check (capacity > 0),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  template_id uuid not null references templates(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  current_capacity integer not null default 0 check (current_capacity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references slots(id) on delete cascade,
  student_phone text not null,
  student_name text not null,
  status booking_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_templates_owner_id on templates(owner_id);
create index if not exists idx_slots_owner_id on slots(owner_id);
create index if not exists idx_slots_template_id on slots(template_id);
create index if not exists idx_slots_start_time on slots(start_time);
create index if not exists idx_bookings_slot_id on bookings(slot_id);
create index if not exists idx_bookings_student_phone on bookings(student_phone);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists trg_templates_updated_at on templates;
create trigger trg_templates_updated_at
before update on templates
for each row execute function set_updated_at();

drop trigger if exists trg_slots_updated_at on slots;
create trigger trg_slots_updated_at
before update on slots
for each row execute function set_updated_at();

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at
before update on bookings
for each row execute function set_updated_at();
