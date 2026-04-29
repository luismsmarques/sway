-- RLS hardening for public tables exposed by PostgREST
-- Safe to run multiple times (idempotent)

alter table if exists public.profiles enable row level security;
alter table if exists public.templates enable row level security;
alter table if exists public.slots enable row level security;
alter table if exists public.bookings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (user_id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (user_id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (user_id = auth.uid());

drop policy if exists templates_own_all on public.templates;
create policy templates_own_all on public.templates
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = templates.owner_id
      and profiles.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = templates.owner_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists slots_own_all on public.slots;
create policy slots_own_all on public.slots
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = slots.owner_id
      and profiles.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = slots.owner_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists bookings_own_all on public.bookings;
create policy bookings_own_all on public.bookings
for all using (
  exists (
    select 1
    from public.slots
    join public.profiles on profiles.id = slots.owner_id
    where slots.id = bookings.slot_id
      and profiles.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.slots
    join public.profiles on profiles.id = slots.owner_id
    where slots.id = bookings.slot_id
      and profiles.user_id = auth.uid()
  )
);
