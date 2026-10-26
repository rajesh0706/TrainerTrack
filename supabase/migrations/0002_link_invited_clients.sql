-- Link a new auth user to an existing client row with the same email.
-- Run after 0001_init.sql if that migration was already applied.

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
  )
  on conflict (id) do nothing;

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

create or replace function public.grant_own_health_consent()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
  set consent_health_data = true, consent_at = now()
  where profile_id = auth.uid();
end;
$$;

grant execute on function public.grant_own_health_consent() to authenticated;
