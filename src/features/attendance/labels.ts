import type { SessionStatus, SessionType } from "@/lib/supabase/database.types";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  attended: "Attended",
  missed: "Missed",
  late: "Late",
  cancelled: "Cancelled",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  personal: "Personal",
  group: "Group",
  online: "Online",
};

export const SESSION_STATUS_DOT: Record<SessionStatus, string> = {
  scheduled: "bg-sky-500",
  attended: "bg-emerald-500",
  missed: "bg-red-500",
  late: "bg-amber-500",
  cancelled: "bg-zinc-400",
};
