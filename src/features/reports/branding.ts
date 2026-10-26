import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReportBranding = {
  businessName: string;
  logoDataUrl: string | null;
};

async function fileToDataUrl(file: Blob, fallbackMime: string) {
  const mime = file.type || fallbackMime;
  if (!mime.startsWith("image/png") && !mime.startsWith("image/jpeg")) {
    return null;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function getReportBranding(trainerId: string): Promise<ReportBranding> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("trainer_settings")
    .select("business_name, logo_path")
    .eq("trainer_id", trainerId)
    .maybeSingle();

  const businessName = data?.business_name?.trim() || "TrainerTrack";
  if (!data?.logo_path) {
    return { businessName, logoDataUrl: null };
  }

  const { data: file } = await supabase.storage
    .from("branding")
    .download(data.logo_path);

  if (!file) {
    return { businessName, logoDataUrl: null };
  }

  return {
    businessName,
    logoDataUrl: await fileToDataUrl(file, "image/png"),
  };
}

export async function imagePathToDataUrl(storagePath: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.storage
    .from("progress-photos")
    .download(storagePath);
  if (!data) return null;
  return fileToDataUrl(data, "image/jpeg");
}
