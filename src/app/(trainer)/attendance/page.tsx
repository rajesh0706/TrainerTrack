import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { AddSessionButton } from "@/features/attendance/components/add-session-button";
import { AttendanceRangeNav } from "@/features/attendance/components/attendance-range-nav";
import { SessionList } from "@/features/attendance/components/session-list";
import { isoDate, parseIsoDate, weekBounds } from "@/features/attendance/dates";
import {
  listSessionsInRange,
  listTrainerClientOptions,
} from "@/features/attendance/queries";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await requireRole("trainer");
  const query = await searchParams;
  const view = query.view === "week" ? "week" : "day";
  const date =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : isoDate(new Date());
  const range =
    view === "week"
      ? weekBounds(parseIsoDate(date))
      : { from: date, to: date };

  const [clients, sessions] = await Promise.all([
    listTrainerClientOptions(user.id),
    listSessionsInRange(user.id, range.from, range.to),
  ]);

  const title =
    view === "week"
      ? `Week of ${formatDate(range.from)} – ${formatDate(range.to)}`
      : formatDate(date, "EEEE d MMMM yyyy");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0 space-y-1"
          title="Attendance"
          description="Mark the day or week in one place."
        />
        <AddSessionButton clients={clients} defaultDate={date} />
      </div>
      <AttendanceRangeNav view={view} date={date} />
      <h2 className="font-heading text-sm font-medium">{title}</h2>
      <SessionList
        sessions={sessions}
        clients={clients}
        showClient
        emptyTitle={view === "week" ? "No sessions this week" : "No sessions today"}
        emptyDescription="Add a session or jump to another date."
      />
    </div>
  );
}
