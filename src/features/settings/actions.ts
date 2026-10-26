"use server";

import { revalidatePath } from "next/cache";

import { brandingSchema, profileSchema } from "@/features/settings/schemas";
import { requireRole, requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateProfileAction(input: unknown) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/me");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateBrandingAction(input: unknown) {
  const user = await requireRole("trainer");
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid branding" };
  }
  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("trainer_settings")
    .select("logo_path")
    .eq("trainer_id", user.id)
    .maybeSingle();
  const { error } = await supabase.from("trainer_settings").upsert({
    trainer_id: user.id,
    business_name: parsed.data.business_name,
    logo_path:
      parsed.data.logo_path !== undefined
        ? parsed.data.logo_path
        : (existing?.logo_path ?? null),
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/reports");
  return { error: null };
}
