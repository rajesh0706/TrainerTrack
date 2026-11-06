import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, rateLimitRetryAfter } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = rateLimit(`export:${user.id}`, 5, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: `Too many exports. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
      },
      { status: 429 },
    );
  }

  const supabase = await createServerSupabaseClient();

  if (user.profile.role === "trainer") {
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("trainer_id", user.id);
    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 500 });
    }

    const clientIds = (clients ?? []).map((client) => client.id);
    const [sessions, measurements, photos, labs, plans, payments] = await Promise.all([
      supabase.from("sessions").select("*").eq("trainer_id", user.id),
      clientIds.length
        ? supabase.from("measurements").select("*").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase.from("progress_photos").select("*").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase.from("lab_results").select("*").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase.from("billing_plans").select("*").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase.from("payments").select("*").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    return NextResponse.json(
      {
        exported_at: new Date().toISOString(),
        role: user.profile.role,
        profile: user.profile,
        clients: clients ?? [],
        sessions: sessions.data ?? [],
        measurements: measurements.data ?? [],
        progress_photos: photos.data ?? [],
        lab_results: labs.data ?? [],
        billing_plans: plans.data ?? [],
        payments: payments.data ?? [],
      },
      {
        headers: {
          "Content-Disposition": 'attachment; filename="trainertrack-export.json"',
        },
      },
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "No linked client record" }, { status: 404 });
  }

  const [sessions, measurements, photos, labs] = await Promise.all([
    supabase.from("sessions").select("*").eq("client_id", client.id),
    supabase.from("measurements").select("*").eq("client_id", client.id),
    supabase.from("progress_photos").select("*").eq("client_id", client.id),
    supabase.from("lab_results").select("*").eq("client_id", client.id),
  ]);

  return NextResponse.json(
    {
      exported_at: new Date().toISOString(),
      role: user.profile.role,
      profile: user.profile,
      client,
      sessions: sessions.data ?? [],
      measurements: measurements.data ?? [],
      progress_photos: photos.data ?? [],
      lab_results: labs.data ?? [],
    },
    {
      headers: {
        "Content-Disposition": 'attachment; filename="trainertrack-my-data.json"',
      },
    },
  );
}
