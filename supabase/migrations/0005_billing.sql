-- Trainer-only billing plans and payment history. Run after 0001_init.sql.

do $$ begin
  create type public.billing_cadence as enum ('monthly', 'quarterly', 'yearly');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.billing_plan_status as enum ('active', 'paused');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('cash', 'upi', 'card', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  cadence public.billing_cadence not null default 'monthly',
  starts_on date not null default current_date,
  next_due_on date not null default current_date,
  status public.billing_plan_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  paid_on date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  period_start date not null,
  period_end date not null,
  method public.payment_method not null default 'cash',
  notes text,
  created_at timestamptz not null default now(),
  constraint payments_period_order check (period_end >= period_start)
);

create index if not exists idx_payments_client_paid
  on public.payments (client_id, paid_on desc);

drop trigger if exists billing_plans_set_updated_at on public.billing_plans;
create trigger billing_plans_set_updated_at
  before update on public.billing_plans
  for each row execute procedure public.set_updated_at();

alter table public.billing_plans enable row level security;
alter table public.payments enable row level security;

drop policy if exists "billing_plans_select_trainer" on public.billing_plans;
create policy "billing_plans_select_trainer"
  on public.billing_plans for select
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "billing_plans_insert_trainer" on public.billing_plans;
create policy "billing_plans_insert_trainer"
  on public.billing_plans for insert
  to authenticated
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "billing_plans_update_trainer" on public.billing_plans;
create policy "billing_plans_update_trainer"
  on public.billing_plans for update
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer())
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "billing_plans_delete_trainer" on public.billing_plans;
create policy "billing_plans_delete_trainer"
  on public.billing_plans for delete
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "payments_select_trainer" on public.payments;
create policy "payments_select_trainer"
  on public.payments for select
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "payments_insert_trainer" on public.payments;
create policy "payments_insert_trainer"
  on public.payments for insert
  to authenticated
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "payments_update_trainer" on public.payments;
create policy "payments_update_trainer"
  on public.payments for update
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer())
  with check (public.owns_client(client_id) and public.is_trainer());

drop policy if exists "payments_delete_trainer" on public.payments;
create policy "payments_delete_trainer"
  on public.payments for delete
  to authenticated
  using (public.owns_client(client_id) and public.is_trainer());
