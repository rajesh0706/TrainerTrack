import type { ProgressPhoto } from "@/lib/supabase/database.types";

export type PhotoWithUrl = ProgressPhoto & { url: string | null };
