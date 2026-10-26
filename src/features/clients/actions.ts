"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clientFormSchema } from "@/features/clients/schemas";
import type { Client, ClientStatus } from "@/lib/supabase/database.types";

type ActionResult = { error: string | null; client?: Client };

function uniqueEmailMessage(message: string) {
  if (message.toLowerCase().includes("clients_email_per_trainer")) {
    return "You already have a client with that email.";
  }
  return message;
}

function payloadFromInput(
  trainerId: string,
  input: ReturnType<typeof clientFormSchema.parse>,
) {
  return {
    trainer_id: trainerId,
    full_name: input.full_name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    date_of_birth: input.date_of_birth,
    gender: input.gender,
    height_cm: input.height_cm,
    goal: input.goal,
    start_date: input.start_date,
    status: input.status,
    notes: input.notes,
    consent_health_data: input.consent_health_data,
    consent_at: input.consent_health_data ? new Date().toISOString() : null,
  };
}

export async function createClientAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client details" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
        ...payloadFromInput(user.id, parsed.data),
        profile_id: null,
      })
    .select("*")
    .single();

  if (error) {
    return { error: uniqueEmailMessage(error.message) };
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { error: null, client: data as Client };
}

export async function updateClientAction(
  clientId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client details" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("consent_health_data, consent_at")
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { error: "Client not found" };
  }

  const payload = payloadFromInput(user.id, parsed.data);
  if (existing.consent_health_data && payload.consent_health_data) {
    payload.consent_at = existing.consent_at;
  }

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { error: uniqueEmailMessage(error.message) };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { error: null, client: data as Client };
}

export async function setClientStatusAction(
  clientId: string,
  status: ClientStatus,
): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { error: null, client: data as Client };
}
