"use server";

import { revalidatePath } from "next/cache";

import { canAccessClient } from "@/features/clients/access";
import { labResultFormSchema } from "@/features/labs/schemas";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LabResult } from "@/lib/supabase/database.types";

type LabResultAction = { error: string | null; result?: LabResult };

function revalidateLabs(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/test-results`);
  revalidatePath("/me/test-results");
}

function payloadFromParsed(data: ReturnType<typeof labResultFormSchema.parse>) {
  return {
    client_id: data.client_id,
    tested_on: data.tested_on,
    b12: data.b12,
    vitamin_d: data.vitamin_d,
    hemogram: data.hemogram,
    hemoglobin: data.hemoglobin,
    homocysteine: data.homocysteine,
    c_reactive_protein: data.c_reactive_protein,
    serum_creatinine: data.serum_creatinine,
    serum_ferritin: data.serum_ferritin,
    urea: data.urea,
    uric_acid: data.uric_acid,
    calcium: data.calcium,
    electrolytes: data.electrolytes,
    lipids: data.lipids,
    fasting_sugar: data.fasting_sugar,
    t3_t4_tsh: data.t3_t4_tsh,
    notes: data.notes,
  };
}

export async function createLabResultAction(input: unknown): Promise<LabResultAction> {
  const user = await requireRole("trainer");
  const parsed = labResultFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid test results" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("lab_results")
    .insert(payloadFromParsed(parsed.data))
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateLabs(parsed.data.client_id);
  return { error: null, result: data as LabResult };
}

export async function updateLabResultAction(
  resultId: string,
  input: unknown,
): Promise<LabResultAction> {
  const user = await requireRole("trainer");
  const parsed = labResultFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid test results" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("lab_results")
    .update(payloadFromParsed(parsed.data))
    .eq("id", resultId)
    .eq("client_id", parsed.data.client_id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateLabs(parsed.data.client_id);
  return { error: null, result: data as LabResult };
}

export async function deleteLabResultAction(
  resultId: string,
  clientId: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const client = await canAccessClient(user, clientId);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("lab_results")
    .delete()
    .eq("id", resultId)
    .eq("client_id", clientId);

  if (error) return { error: error.message };
  revalidateLabs(clientId);
  return { error: null };
}
