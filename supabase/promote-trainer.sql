-- After creating a user in Authentication → Users, promote that account to trainer.
-- Replace the UUID with the auth user id.

update public.profiles
set role = 'trainer'
where id = '00000000-0000-0000-0000-000000000000';

insert into public.trainer_settings (trainer_id, business_name)
values ('00000000-0000-0000-0000-000000000000', 'TrainerTrack Studio')
on conflict (trainer_id) do nothing;
