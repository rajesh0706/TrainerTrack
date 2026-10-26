import type { Metadata } from "next";

import { AddSessionButton } from "@/features/attendance/components/add-session-button";
import {
  AttendanceCalendar,
  AttendanceLegend,
} from "@/features/attendance/components/attendance-calendar";
import { SessionList } from "@/features/attendance/components/session-list";
import { monthBounds, parseMonthKey } from "@/features/attendance/dates";
import { listSessionsInRange } from "@/features/attendance/queries";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Attendance" };

export default async function ClientAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const query = await searchParams;
  const client = await getTrainerClient(user.id, id);
  const month = parseMonthKey(query.month);
  const { from, to } = monthBounds(month);
  const sessions = await listSessionsInRange(user.id, from, to, client.id);
  const visible = query.day
    ? sessions.filter((session) => session.session_date === query.day)
    : sessions;
  const clientOption = {
    id: client.id,
    full_name: client.full_name,
    status: client.status,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AttendanceLegend />
        <AddSessionButton
          clients={[clientOption]}
          lockedClientId={client.id}
          defaultDate={query.day}
        />
      </div>
      <AttendanceCalendar
        month={month}
        sessions={sessions}
        selectedDay={query.day}
        basePath={`/clients/${client.id}/attendance`}
      />
      <SessionList
        sessions={visible}
        clients={[clientOption]}
        lockedClientId={client.id}
        emptyTitle={query.day ? "No sessions on this day" : "No sessions this month"}
        emptyDescription="Add a session or pick another day on the calendar."
      />
    </div>
  );
}
