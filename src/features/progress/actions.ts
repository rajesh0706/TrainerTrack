"use server";

import { revalidatePath } from "next/cache";

import {
  measurementFormSchema,
  photoMetaSchema,
} from "@/features/progress/schemas";
import { canAccessClient } from "@/features/clients/access";
import { requireRole, requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Measurement, ProgressPhoto } from "@/lib/supabase/database.types";

type MeasurementResult = { error: string | null; measurement?: Measurement };
type PhotoResult = { error: string | null; photo?: ProgressPhoto };

const CONSENT_ERROR =
  "This client has not consented to storing measurements or photos.";

function revalidateProgress(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}/photos`);
  revalidatePath("/dashboard");
  revalidatePath("/me");
  revalidatePath("/me/progress");
}

export async function createMeasurementAction(
  input: unknown,
): Promise<MeasurementResult> {
  const user = await requireUser();
  const parsed = measurementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid measurement" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };
  if (!client.consent_health_data) return { error: CONSENT_ERROR };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("measurements")
    .insert({
      client_id: parsed.data.client_id,
      measured_on: parsed.data.measured_on,
      weight_kg: parsed.data.weight_kg,
      body_fat_pct: parsed.data.body_fat_pct,
      chest_cm: parsed.data.chest_cm,
      waist_cm: parsed.data.waist_cm,
      hips_cm: parsed.data.hips_cm,
      arm_cm: parsed.data.arm_cm,
      thigh_cm: parsed.data.thigh_cm,
      notes: parsed.data.notes,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateProgress(parsed.data.client_id);
  return { error: null, measurement: data as Measurement };
}

export async function updateMeasurementAction(
  measurementId: string,
  input: unknown,
): Promise<MeasurementResult> {
  const user = await requireRole("trainer");
  const parsed = measurementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid measurement" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client || user.profile.role !== "trainer") {
    return { error: "Client not found" };
  }
  if (!client.consent_health_data) return { error: CONSENT_ERROR };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("measurements")
    .update({
      measured_on: parsed.data.measured_on,
      weight_kg: parsed.data.weight_kg,
      body_fat_pct: parsed.data.body_fat_pct,
      chest_cm: parsed.data.chest_cm,
      waist_cm: parsed.data.waist_cm,
      hips_cm: parsed.data.hips_cm,
      arm_cm: parsed.data.arm_cm,
      thigh_cm: parsed.data.thigh_cm,
      notes: parsed.data.notes,
    })
    .eq("id", measurementId)
    .eq("client_id", parsed.data.client_id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateProgress(parsed.data.client_id);
  return { error: null, measurement: data as Measurement };
}

export async function deleteMeasurementAction(
  measurementId: string,
  clientId: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const client = await canAccessClient(user, clientId);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("measurements")
    .delete()
    .eq("id", measurementId)
    .eq("client_id", clientId);

  if (error) return { error: error.message };
  revalidateProgress(clientId);
  return { error: null };
}

export async function createPhotoRecordAction(
  input: unknown,
): Promise<PhotoResult> {
  const user = await requireUser();
  const parsed = photoMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid photo" };
  }
  if (!parsed.data.storage_path.startsWith(`${parsed.data.client_id}/`)) {
    return { error: "Invalid storage path" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };
  if (!client.consent_health_data) return { error: CONSENT_ERROR };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      client_id: parsed.data.client_id,
      taken_on: parsed.data.taken_on,
      storage_path: parsed.data.storage_path,
      label: parsed.data.label,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateProgress(parsed.data.client_id);
  return { error: null, photo: data as ProgressPhoto };
}

export async function deletePhotoAction(
  photoId: string,
  clientId: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const client = await canAccessClient(user, clientId);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { data: photo, error: loadError } = await supabase
    .from("progress_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!photo) return { error: "Photo not found" };

  await supabase.storage.from("progress-photos").remove([photo.storage_path]);

  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("client_id", clientId);

  if (error) return { error: error.message };
  revalidateProgress(clientId);
  return { error: null };
}

export async function grantOwnConsentAction(): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (user.profile.role !== "client") {
    return { error: "Only clients can grant their own consent here" };
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("grant_own_health_consent");
  if (error) return { error: error.message };
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (data) revalidateProgress(data.id);
  revalidatePath("/me/progress");
  return { error: null };
}
