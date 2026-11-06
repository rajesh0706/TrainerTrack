# TrainerTrack

A web app for a personal trainer to manage clients, attendance, progress photos and measurements, and downloadable reports. Clients can sign in to a read-mostly portal for their own data.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage) with Row Level Security
- Zod + React Hook Form
- Recharts, `@react-pdf/renderer`, SheetJS
- Vitest + Playwright
- Vercel + Supabase free tier

## Setup

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — tables, indexes, RLS, auth trigger, private buckets `progress-photos` and `branding`
   - `supabase/migrations/0002_link_invited_clients.sql` — links invited users to `clients.profile_id` by email and adds `grant_own_health_consent`
   - `supabase/migrations/0003_lab_results.sql` — blood-work / test results table and RLS
   - `supabase/migrations/0004_session_status_scheduled.sql` — adds `scheduled` for future sessions
   - `supabase/migrations/0005_billing.sql` — billing plans and payment history (trainer only)
3. In **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/login`, `http://localhost:3000/reset-password`

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in values from **Project Settings → API**:

| Variable | Where it lives | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Safe to expose; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Invites and the seed script. Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_APP_URL` | Browser + server | `http://localhost:3000` locally |

### 3. Create a trainer account

Either seed (step 5) or:

1. In Supabase **Authentication → Users**, add a user with email + password.
2. Copy the user UUID.
3. Run `supabase/promote-trainer.sql` in the SQL editor after replacing the placeholder UUID.

New auth users get a `profiles` row automatically (default role `client`) via `handle_new_user`. Invited clients are linked to an existing `clients` row by email.

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to `/login`.

Sign in as the trainer to land on `/dashboard`. Clients land on `/me`.

### 5. Seed demo data (optional)

Needs `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run seed
```

Creates (or reuses) `trainer@trainertrack.local` / `ChangeMe123!`, eight clients, three months of twice-weekly sessions, and weekly measurements.

Override with `SEED_TRAINER_EMAIL` and `SEED_TRAINER_PASSWORD`.

## App map

**Trainer:** `/dashboard` (all-clients schedule calendar + .ics download for Google Calendar), `/clients`, `/attendance`, `/reports`, `/settings`

- Invite a client from their overview (service role + email). They set a password from the invite mail and use `/me`.
- **Delete all data** on overview permanently removes the client, sessions, measurements, photos, lab results, billing, and storage objects (type the full name to confirm).
- Client **Test Results** records blood work (date, notes, B12, Vitamin D, hemogram, hemoglobin, and related labs).
- Client **Billing** (trainer only) stores a monthly/quarterly/yearly plan and a payment log. Recording a payment advances the next due date. Overview shows amount, cadence, and next due.
- Settings: profile, PDF business name/logo (`branding/{trainerId}/logo.jpg`), JSON data export.

**Client:** `/me`, `/me/attendance` (read-only), `/me/progress` (add measurements/photos after consent), `/me/test-results` (read-only labs), `/me/reports` (own files only).

**Public:** `/privacy`

Health measurements and photos require a consent checkbox (trainer form or client portal). Attendance percentage is `(attended + late) / (attended + missed + late)`; cancelled and scheduled (upcoming) sessions are excluded.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run format
npm run test          # Vitest: attendance % and progress-change math
npm run test:e2e      # Playwright (needs a trainer login; see below)
npm run seed
```

### Playwright

Uses `E2E_EMAIL` / `E2E_PASSWORD`, or the seed trainer variables:

```bash
E2E_EMAIL=trainer@trainertrack.local E2E_PASSWORD=ChangeMe123! npm run test:e2e
```

Covers login, adding a client, marking attendance, and downloading a PDF. Tests skip if those env vars are missing. First time: `npx playwright install chromium`.

## Deploy (Vercel)

1. Push the repo and import it in Vercel.
2. Set the same environment variables as `.env.local` (including `NEXT_PUBLIC_APP_URL=https://your-domain` and the **service role** as a server secret, not `NEXT_PUBLIC_`).
3. In Supabase Auth URL config, add the production site URL and:
   - `https://your-domain/login`
   - `https://your-domain/reset-password`
4. Confirm SQL migrations have been applied on that project.
5. Deploy. First production login should be the trainer you already promoted or seeded.

## Security notes

- RLS on every table; the browser only uses the anon/publishable key.
- Zod validation on mutations and report query strings.
- Private storage buckets; photos are not public.
- In-memory rate limits on login, password reset, invites, reports, and JSON export (per server instance; use a shared store if you scale out).
- `/privacy` plus consent and cascade delete for health data.
