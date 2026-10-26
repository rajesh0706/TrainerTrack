-- TrainerTrack initial schema, RLS, storage, and helper functions.
-- Run this in the Supabase SQL editor (or via the CLI) after creating a project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('trainer', 'client');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.client_status as enum ('active', 'paused', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_type as enum ('personal', 'group', 'online');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status as enum ('attended', 'missed', 'cancelled', 'late');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.photo_label as enum ('front', 'side', 'back', 'other');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainer_settings (
  trainer_id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null default 'TrainerTrack',
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text,
  height_cm numeric(5, 2),
  goal text,
  start_date date not null default current_date,
  status public.client_status not null default 'active',
  notes text,
  consent_health_data boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clients_email_per_trainer unique (trainer_id, email)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  start_time time not null,
  duration_min integer not null check (duration_min > 0),
  type public.session_type not null default 'personal',
  status public.session_status not null default 'attended',
  notes text,
  created_at timestamptz not null default now(),
  constraint sessions_unique_attendance unique (client_id, session_date, start_time)
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(6, 2),
  body_fat_pct numeric(5, 2),
  chest_cm numeric(6, 2),
  waist_cm numeric(6, 2),
  hips_cm numeric(6, 2),
  arm_cm numeric(6, 2),
  thigh_cm numeric(6, 2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  taken_on date not null default current_date,
  storage_path text not null,
  label public.photo_label not null default 'other',
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  logged_on date not null default current_date,
  exercise text not null,
  sets integer check (sets is null or sets >= 0),
  reps integer check (reps is null or reps >= 0),
  weight_kg numeric(6, 2),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_clients_trainer_id on public.clients (trainer_id);
create index if not exists idx_clients_profile_id on public.clients (profile_id);
create index if not exists idx_clients_status on public.clients (status);
create index if not exists idx_sessions_client_id on public.sessions (client_id);
create index if not exists idx_sessions_session_date on public.sessions (session_date);
create index if not exists idx_sessions_trainer_date on public.sessions (trainer_id, session_date);
create index if not exists idx_measurements_client_date on public.measurements (client_id, measured_on);
create index if not exists idx_progress_photos_client on public.progress_photos (client_id);
create index if not exists idx_workout_logs_client_date on public.workout_logs (client_id, logged_on);

-- ---------------------------------------------------------------------------
-- Auth: create a profile row for every new auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'client'
  );

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );

  if requested_role = 'trainer' then
    insert into public.trainer_settings (trainer_id, business_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'business_name', 'TrainerTrack')
    )
    on conflict (trainer_id) do nothing;
  end if;

  if new.email is not null then
    update public.clients
    set profile_id = new.id
    where lower(email) = lower(new.email)
      and profile_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  -- Block authenticated app users. SQL editor / service role (no JWT) can promote trainers.
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Role changes are not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_profile_role_change();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trainer_settings_set_updated_at on public.trainer_settings;
create trigger trainer_settings_set_updated_at
  before update on public.trainer_settings
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS (stable, security definer, locked search_path)
-- ---------------------------------------------------------------------------
create or replace function public.is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'trainer'
  );
$$;

create or replace function public.owns_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients
    where id = p_client_id and trainer_id = auth.uid()
  );
$$;

create or replace function public.is_own_client_row(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients
    where id = p_client_id and profile_id = auth.uid()
  );
$$;

grant execute on function public.is_trainer() to authenticated;
grant execute on function public.owns_client(uuid) to authenticated;
grant execute on function public.is_own_client_row(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trainer_settings enable row level security;
alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.workout_logs enable row level security;

-- Profiles
drop policy if exists "profiles_select_own_or_trainer" on public.profiles;
create policy "profiles_select_own_or_trainer"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or (
      public.is_trainer()
      and exists (
        select 1 from public.clients c
        where c.profile_id = profiles.id and c.trainer_id = auth.uid()
      )
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Trainer settings
drop policy if exists "trainer_settings_select_own" on public.trainer_settings;
create policy "trainer_settings_select_own"
  on public.trainer_settings for select
  to authenticated
  using (trainer_id = auth.uid());

-- Clients can see their trainer's public branding (logo / business name on reports)
drop policy if exists "trainer_settings_select_for_clients" on public.trainer_settings;
create policy "trainer_settings_select_for_clients"
  on public.trainer_settings for select
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.profile_id = auth.uid() and c.trainer_id = trainer_settings.trainer_id
    )
  );

drop policy if exists "trainer_settings_write_own" on public.trainer_settings;
create policy "trainer_settings_write_own"
  on public.trainer_settings for all
  to authenticated
  using (trainer_id = auth.uid() and public.is_trainer())
  with check (trainer_id = auth.uid() and public.is_trainer());

-- Clients
drop policy if exists "clients_select" on public.clients;
create policy "clients_select"
  on public.clients for select
  to authenticated
  using (trainer_id = auth.uid() or profile_id = auth.uid());

drop policy if exists "clients_insert_trainer" on public.clients;
create policy "clients_insert_trainer"
  on public.clients for insert
  to authenticated
  with check (trainer_id = auth.uid() and public.is_trainer());

drop policy if exists "clients_update_trainer" on public.clients;
create policy "clients_update_trainer"
  on public.clients for update
  to authenticated
  using (trainer_id = auth.uid() and public.is_trainer())
  with check (trainer_id = auth.uid() and public.is_trainer());

drop policy if exists "clients_delete_trainer" on public.clients;
create policy "clients_delete_trainer"
  on public.clients for delete
  to authenticated
  using (trainer_id = auth.uid() and public.is_trainer());

-- Sessions
drop policy if exists "sessions_select" on public.sessions;
create policy "sessions_select"
  on public.sessions for select
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "sessions_write_trainer" on public.sessions;
create policy "sessions_write_trainer"
  on public.sessions for all
  to authenticated
  using (public.owns_client(client_id) and trainer_id = auth.uid())
  with check (public.owns_client(client_id) and trainer_id = auth.uid());

-- Measurements: trainers full access; clients can insert/update/delete their own
drop policy if exists "measurements_select" on public.measurements;
create policy "measurements_select"
  on public.measurements for select
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "measurements_insert" on public.measurements;
create policy "measurements_insert"
  on public.measurements for insert
  to authenticated
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "measurements_update" on public.measurements;
create policy "measurements_update"
  on public.measurements for update
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id))
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "measurements_delete" on public.measurements;
create policy "measurements_delete"
  on public.measurements for delete
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

-- Progress photos
drop policy if exists "progress_photos_select" on public.progress_photos;
create policy "progress_photos_select"
  on public.progress_photos for select
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "progress_photos_insert" on public.progress_photos;
create policy "progress_photos_insert"
  on public.progress_photos for insert
  to authenticated
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "progress_photos_update" on public.progress_photos;
create policy "progress_photos_update"
  on public.progress_photos for update
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id))
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "progress_photos_delete" on public.progress_photos;
create policy "progress_photos_delete"
  on public.progress_photos for delete
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

-- Workout logs
drop policy if exists "workout_logs_select" on public.workout_logs;
create policy "workout_logs_select"
  on public.workout_logs for select
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "workout_logs_insert" on public.workout_logs;
create policy "workout_logs_insert"
  on public.workout_logs for insert
  to authenticated
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "workout_logs_update" on public.workout_logs;
create policy "workout_logs_update"
  on public.workout_logs for update
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id))
  with check (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "workout_logs_delete" on public.workout_logs;
create policy "workout_logs_delete"
  on public.workout_logs for delete
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

-- ---------------------------------------------------------------------------
-- Private storage bucket for progress photos
-- Path convention: {client_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "progress_photos_storage_select" on storage.objects;
create policy "progress_photos_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (
      public.owns_client((storage.foldername(name))[1]::uuid)
      or public.is_own_client_row((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "progress_photos_storage_insert" on storage.objects;
create policy "progress_photos_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (
      public.owns_client((storage.foldername(name))[1]::uuid)
      or public.is_own_client_row((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "progress_photos_storage_update" on storage.objects;
create policy "progress_photos_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (
      public.owns_client((storage.foldername(name))[1]::uuid)
      or public.is_own_client_row((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "progress_photos_storage_delete" on storage.objects;
create policy "progress_photos_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (
      public.owns_client((storage.foldername(name))[1]::uuid)
      or public.is_own_client_row((storage.foldername(name))[1]::uuid)
    )
  );

-- Branding logos (private): {trainer_id}/logo.*
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "branding_storage_own" on storage.objects;
create policy "branding_storage_own"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
