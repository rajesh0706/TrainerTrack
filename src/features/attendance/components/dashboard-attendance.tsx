import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuickMarkButtons } from "@/features/attendance/components/quick-mark-buttons";
import { SessionStatusBadge } from "@/features/attendance/components/session-status-badge";
import { SESSION_STATUS_LABELS } from "@/features/attendance/labels";
import type { AttendanceSummary } from "@/features/attendance/calculations";
import type { SessionWithClient } from "@/features/attendance/types";
import { formatPercent, formatTime } from "@/lib/format";

type Dashboard = {
  activeClientCount: number;
  sessionsThisWeek: number;
  monthAttendance: AttendanceSummary;
  lowAttendance: Array<{
    id: string;
    full_name: string;
    rate: number | null;
    scheduled: number;
  }>;
  todaysSessions: SessionWithClient[];
  recentSessions: SessionWithClient[];
};

export function DashboardAttendance({ data }: { data: Dashboard }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active clients"
          value={String(data.activeClientCount)}
          hint="Not paused or archived"
        />
        <StatCard
          label="Sessions this week"
          value={String(data.sessionsThisWeek)}
          hint="Monday–Sunday"
        />
        <StatCard
          label="Attendance this month"
          value={formatPercent(data.monthAttendance.rate)}
          hint={`${data.monthAttendance.present} of ${data.monthAttendance.scheduled} counted`}
        />
        <StatCard
          label="Low attendance"
          value={String(data.lowAttendance.length)}
          hint="Under 60% this month"
        />
      </div>
      {data.lowAttendance.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Needs follow-up</CardTitle>
            <CardDescription>Clients under 60% attendance this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {data.lowAttendance.map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/clients/${client.id}/attendance`} className="hover:underline">
                    {client.full_name}
                  </Link>
                  <span className="text-muted-foreground">{formatPercent(client.rate)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-medium">Today’s sessions</h2>
        </div>
        {data.todaysSessions.length === 0 ? (
          <EmptyState
            title="Nothing on the board today"
            description="Add a session or open the attendance calendar."
          />
        ) : (
          <ul className="grid gap-3">
            {data.todaysSessions.map((session) => (
              <li key={session.id} className="rounded-xl border p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/clients/${session.client_id}/attendance`}
                      className="font-medium hover:underline"
                    >
                      {session.client_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(session.start_time)} · {session.duration_min} min
                    </p>
                  </div>
                  <SessionStatusBadge status={session.status} />
                </div>
                <QuickMarkButtons sessionId={session.id} current={session.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest sessions you logged.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
          ) : (
            <ul className="grid gap-3">
              {data.recentSessions.map((session) => (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <Link
                      href={`/clients/${session.client_id}/attendance`}
                      className="font-medium hover:underline"
                    >
                      {session.client_name}
                    </Link>{" "}
                    marked {SESSION_STATUS_LABELS[session.status].toLowerCase()}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}
