import type { ClientStatus } from "@/lib/supabase/database.types";
import { GENDERS } from "@/features/clients/schemas";

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  prefer_not_to_say: "Prefer not to say",
  other: "Other",
};
