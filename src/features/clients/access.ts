import { requireUser, type CurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/supabase/database.types";

export async function getOwnClient(): Promise<Client | null> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Client | null) ?? null;
}

export async function canAccessClient(user: CurrentUser, clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("clients")
    .select("id, trainer_id, profile_id, consent_health_data")
    .eq("id", clientId)
    .maybeSingle();

  if (!data) return null;
  if (user.profile.role === "trainer" && data.trainer_id === user.id) return data;
  if (user.profile.role === "client" && data.profile_id === user.id) return data;
  return null;
}
