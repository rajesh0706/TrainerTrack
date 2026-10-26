import type { SessionStatus } from "@/lib/supabase/database.types";

export type AttendanceSummary = {
  attended: number;
  missed: number;
  cancelled: number;
  late: number;
  total: number;
  scheduled: number;
  present: number;
  rate: number | null;
};

export function summarizeAttendance(
  statuses: readonly SessionStatus[],
): AttendanceSummary {
  const counts = {
    attended: 0,
    missed: 0,
    cancelled: 0,
    late: 0,
    total: statuses.length,
  };

  for (const status of statuses) {
    counts[status] += 1;
  }

  const scheduled = counts.attended + counts.missed + counts.late;
  const present = counts.attended + counts.late;
  const rate = scheduled === 0 ? null : (present / scheduled) * 100;

  return { ...counts, scheduled, present, rate };
}
