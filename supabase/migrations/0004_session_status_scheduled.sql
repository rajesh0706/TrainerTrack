-- Add a status for future / planned sessions.
-- Run in the Supabase SQL editor after 0001_init.sql.

alter type public.session_status add value if not exists 'scheduled';
