"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/env";
import { rateLimit, rateLimitRetryAfter } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function inviteClientAction(
  clientId: string,
): Promise<{ error: string | null; success?: string }> {
  const user = await requireRole("trainer");
  const limit = rateLimit(`invite:${user.id}`, 10, 15 * 60 * 1000);
  if (!limit.success) {
    return {
      error: `Too many invites. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, email, full_name, profile_id")
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .maybeSingle();

  if (!client) return { error: "Client not found" };
  if (client.profile_id) {
    return { error: "This client already has a login." };
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    return {
      error:
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local to send invite emails.",
    };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(client.email, {
    redirectTo: `${getAppUrl()}/login`,
    data: {
      role: "client",
      full_name: client.full_name,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user?.id) {
    await supabase
      .from("clients")
      .update({ profile_id: data.user.id })
      .eq("id", client.id)
      .eq("trainer_id", user.id);
  }

  revalidatePath(`/clients/${client.id}`);
  revalidatePath("/clients");
  return { error: null, success: `Invite sent to ${client.email}` };
}

export async function deleteClientAndDataAction(
  clientId: string,
  confirmation: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const supabase = await createServerSupabaseClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .maybeSingle();

  if (!client) return { error: "Client not found" };
  if (confirmation.trim().toLowerCase() !== client.full_name.trim().toLowerCase()) {
    return { error: "Type the client’s full name to confirm deletion." };
  }

  const { data: photos } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("client_id", clientId);

  const paths = (photos ?? []).map((photo) => photo.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("progress-photos").remove(paths);
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("trainer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { error: null };
}
