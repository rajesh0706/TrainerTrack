import type { SessionStatus } from "@/lib/supabase/database.types";

export type AttendanceSummary = {
  attended: number;
  missed: number;
  cancelled: number;
  late: number;
  planned: number;
  total: number;
  scheduled: number;
  present: number;
  rate: number | null;
};

export function summarizeAttendance(
  statuses: readonly SessionStatus[],
): AttendanceSummary {
  const counts: Record<SessionStatus, number> = {
    scheduled: 0,
    attended: 0,
    missed: 0,
    cancelled: 0,
    late: 0,
  };

  for (const status of statuses) {
    counts[status] += 1;
  }

  const counted = counts.attended + counts.missed + counts.late;
  const present = counts.attended + counts.late;
  const rate = counted === 0 ? null : (present / counted) * 100;

  return {
    attended: counts.attended,
    missed: counts.missed,
    cancelled: counts.cancelled,
    late: counts.late,
    planned: counts.scheduled,
    total: statuses.length,
    scheduled: counted,
    present,
    rate,
  };
}
