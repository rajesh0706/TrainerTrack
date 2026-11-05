-- Blood-work / lab results for a client. Run after 0001_init.sql (and 0002 if needed).

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  tested_on date not null default current_date,
  b12 text,
  vitamin_d text,
  hemogram text,
  hemoglobin text,
  homocysteine text,
  c_reactive_protein text,
  serum_creatinine text,
  serum_ferritin text,
  urea text,
  uric_acid text,
  calcium text,
  electrolytes text,
  lipids text,
  fasting_sugar text,
  t3_t4_tsh text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_lab_results_client_date
  on public.lab_results (client_id, tested_on);

alter table public.lab_results enable row level security;

drop policy if exists "lab_results_select" on public.lab_results;
create policy "lab_results_select"
  on public.lab_results for select
  to authenticated
  using (public.owns_client(client_id) or public.is_own_client_row(client_id));

drop policy if exists "lab_results_insert_trainer" on public.lab_results;
create policy "lab_results_insert_trainer"
  on public.lab_results for insert
  to authenticated
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "lab_results_update_trainer" on public.lab_results;
create policy "lab_results_update_trainer"
  on public.lab_results for update
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer())
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "lab_results_delete_trainer" on public.lab_results;
create policy "lab_results_delete_trainer"
  on public.lab_results for delete
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer());
