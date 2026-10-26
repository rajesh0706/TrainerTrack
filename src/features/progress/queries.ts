import { toNumber } from "@/features/progress/numbers";
import type { PhotoWithUrl } from "@/features/progress/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Measurement, ProgressPhoto } from "@/lib/supabase/database.types";

export type { PhotoWithUrl };

function normalizeMeasurement(row: Measurement): Measurement {
  return {
    ...row,
    weight_kg: toNumber(row.weight_kg),
    body_fat_pct: toNumber(row.body_fat_pct),
    chest_cm: toNumber(row.chest_cm),
    waist_cm: toNumber(row.waist_cm),
    hips_cm: toNumber(row.hips_cm),
    arm_cm: toNumber(row.arm_cm),
    thigh_cm: toNumber(row.thigh_cm),
  };
}

export async function listMeasurements(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", clientId)
    .order("measured_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Measurement[]).map(normalizeMeasurement);
}

export async function listProgressPhotos(clientId: string): Promise<PhotoWithUrl[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", clientId)
    .order("taken_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const photos = (data ?? []) as ProgressPhoto[];
  if (photos.length === 0) return [];

  const { data: signed, error: signedError } = await supabase.storage
    .from("progress-photos")
    .createSignedUrls(
      photos.map((photo) => photo.storage_path),
      60 * 60,
    );

  if (signedError) {
    return photos.map((photo) => ({ ...photo, url: null }));
  }

  const urlByPath = new Map(
    (signed ?? []).map((item) => [item.path, item.signedUrl ?? null]),
  );

  return photos.map((photo) => ({
    ...photo,
    url: urlByPath.get(photo.storage_path) ?? null,
  }));
}
