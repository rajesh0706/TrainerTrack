import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { DashboardAttendance } from "@/features/attendance/components/dashboard-attendance";
import { TrainerScheduleCalendar } from "@/features/attendance/components/trainer-schedule-calendar";
import {
  calendarGridRange,
  isoDate,
  parseIsoDate,
  parseMonthKey,
  weekBounds,
} from "@/features/attendance/dates";
import {
  getTrainerDashboard,
  listSessionsInRange,
  listTrainerClientOptions,
} from "@/features/attendance/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; date?: string; day?: string }>;
}) {
  const user = await requireRole("trainer");
  const query = await searchParams;
  const view = query.view === "week" ? "week" : "month";
  const month = parseMonthKey(query.month);
  const weekDate =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : isoDate(new Date());
  const selectedDay =
    query.day && /^\d{4}-\d{2}-\d{2}$/.test(query.day) ? query.day : undefined;
  const range =
    view === "week" ? weekBounds(parseIsoDate(weekDate)) : calendarGridRange(month);

  const [data, clients, sessions] = await Promise.all([
    getTrainerDashboard(user.id),
    listTrainerClientOptions(user.id),
    listSessionsInRange(user.id, range.from, range.to),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.profile.full_name}`}
        description="Plan the week across every client, then mark today’s sessions."
      />
      <TrainerScheduleCalendar
        view={view}
        month={month}
        weekDate={weekDate}
        selectedDay={selectedDay}
        sessions={sessions}
        clients={clients}
      />
      <DashboardAttendance data={data} />
    </div>
  );
}
