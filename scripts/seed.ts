import { addDays, format, startOfWeek, subMonths } from "date-fns";
import { createClient } from "@supabase/supabase-js";

import { loadEnvLocal } from "./load-env";

loadEnvLocal();

const PLACEHOLDERS = new Set(["your_anon_key", "your_service_role_key"]);

const CLIENTS = [
  { full_name: "Amelia Chen", email: "amelia.chen@seed.trainertrack.local", gender: "female", goal: "Strength" },
  { full_name: "Ben Okonkwo", email: "ben.okonkwo@seed.trainertrack.local", gender: "male", goal: "Fat loss" },
  { full_name: "Cara Singh", email: "cara.singh@seed.trainertrack.local", gender: "female", goal: "Marathon" },
  { full_name: "Diego Alvarez", email: "diego.alvarez@seed.trainertrack.local", gender: "male", goal: "Hypertrophy" },
  { full_name: "Elena Rossi", email: "elena.rossi@seed.trainertrack.local", gender: "female", goal: "Posture" },
  { full_name: "Farid Hassan", email: "farid.hassan@seed.trainertrack.local", gender: "male", goal: "Mobility" },
  { full_name: "Grace Park", email: "grace.park@seed.trainertrack.local", gender: "female", goal: "General fitness" },
  { full_name: "Hiro Tanaka", email: "hiro.tanaka@seed.trainertrack.local", gender: "male", goal: "Rehab" },
] as const;

const STATUSES = ["attended", "attended", "attended", "late", "missed", "cancelled"] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service || PLACEHOLDERS.has(service)) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before seeding.",
    );
  }

  const email = process.env.SEED_TRAINER_EMAIL ?? "trainer@trainertrack.local";
  const password = process.env.SEED_TRAINER_PASSWORD ?? "ChangeMe123!";
  const supabase = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let trainerId: string | undefined;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Studio Trainer", role: "trainer" },
  });

  if (created.user) {
    trainerId = created.user.id;
  } else if (createError?.message.toLowerCase().includes("already")) {
    const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    trainerId = listed.data.users.find((user) => user.email === email)?.id;
  } else if (createError) {
    throw createError;
  }

  if (!trainerId) {
    throw new Error(`Could not create or find trainer ${email}`);
  }

  await supabase.from("profiles").upsert({
    id: trainerId,
    role: "trainer",
    full_name: "Studio Trainer",
  });
  await supabase.from("trainer_settings").upsert({
    trainer_id: trainerId,
    business_name: "Studio Trainer",
  });

  const start = startOfWeek(subMonths(new Date(), 3), { weekStartsOn: 1 });
  const today = new Date();

  for (const [index, spec] of CLIENTS.entries()) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("trainer_id", trainerId)
      .eq("email", spec.email)
      .maybeSingle();

    let clientId = existing?.id as string | undefined;
    if (!clientId) {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          trainer_id: trainerId,
          full_name: spec.full_name,
          email: spec.email,
          gender: spec.gender,
          goal: spec.goal,
          start_date: format(start, "yyyy-MM-dd"),
          status: index === 7 ? "paused" : "active",
          consent_health_data: true,
          consent_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      clientId = data.id;
    }

    const sessions = [];
    for (let day = start; day <= today; day = addDays(day, 1)) {
      const weekday = day.getDay();
      if (weekday !== 1 && weekday !== 4) continue;
      const stamp = Math.floor(day.getTime() / 86400000) + index;
      sessions.push({
        client_id: clientId,
        trainer_id: trainerId,
        session_date: format(day, "yyyy-MM-dd"),
        start_time: weekday === 1 ? "07:00" : "18:00",
        duration_min: 60,
        type: "personal" as const,
        status: STATUSES[stamp % STATUSES.length],
      });
    }

    if (sessions.length) {
      const { error } = await supabase.from("sessions").upsert(sessions, {
        onConflict: "client_id,session_date,start_time",
      });
      if (error) throw error;
    }

    const { count } = await supabase
      .from("measurements")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (!count) {
      const rows = [];
      let week = 0;
      for (let day = start; day <= today; day = addDays(day, 7), week += 1) {
        rows.push({
          client_id: clientId,
          measured_on: format(day, "yyyy-MM-dd"),
          weight_kg: 70 + index - week * 0.15,
          body_fat_pct: 22 - week * 0.1,
          waist_cm: 80 - week * 0.2,
        });
      }
      const { error } = await supabase.from("measurements").insert(rows);
      if (error) throw error;
    }
  }

  console.log(`Seeded trainer ${email} (${trainerId}) with ${CLIENTS.length} clients.`);
  console.log("Sign in with SEED_TRAINER_EMAIL / SEED_TRAINER_PASSWORD (default ChangeMe123!).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
