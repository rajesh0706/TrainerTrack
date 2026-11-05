import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LabResult } from "@/lib/supabase/database.types";

export async function listLabResults(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("lab_results")
    .select("*")
    .eq("client_id", clientId)
    .order("tested_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LabResult[];
}
