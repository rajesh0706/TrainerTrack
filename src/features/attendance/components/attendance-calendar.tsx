import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { SESSION_STATUS_DOT } from "@/features/attendance/labels";
import { WEEK_STARTS_ON, isoDate, monthBounds, monthKey } from "@/features/attendance/dates";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Session, SessionStatus } from "@/lib/supabase/database.types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AttendanceCalendar({
  month,
  sessions,
  selectedDay,
  basePath,
}: {
  month: Date;
  sessions: Session[];
  selectedDay?: string;
  basePath: string;
}) {
  const { previous, next } = monthBounds(month);
  const today = isoDate(new Date());
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = new Map<string, SessionStatus[]>();
  for (const session of sessions) {
    const list = byDay.get(session.session_date) ?? [];
    list.push(session.status);
    byDay.set(session.session_date, list);
  }

  function href(params: { month?: string; day?: string }) {
    const search = new URLSearchParams();
    search.set("month", params.month ?? monthKey(month));
    if (params.day) search.set("day", params.day);
    return `${basePath}?${search.toString()}`;
  }

  return (
    <section className="rounded-xl border p-4" aria-label="Attendance calendar">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" render={<Link href={href({ month: previous })} />}>
          Previous
        </Button>
        <h2 className="font-heading text-sm font-medium">{format(month, "MMMM yyyy")}</h2>
        <Button variant="outline" size="sm" render={<Link href={href({ month: next })} />}>
          Next
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 font-medium">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = isoDate(day);
          const statuses = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDay === key;
          const unique = Array.from(new Set(statuses));
          return (
            <Link
              key={key}
              href={href({ day: key })}
              className={cn(
                "flex min-h-14 flex-col items-center rounded-lg p-1 text-sm hover:bg-muted",
                !inMonth && "text-muted-foreground/50",
                key === today && "ring-1 ring-ring",
                selected && "bg-muted font-medium",
              )}
              aria-current={selected ? "date" : undefined}
              aria-label={format(day, "EEEE d MMMM")}
            >
              {format(day, "d")}
              <span className="mt-1 flex gap-0.5">
                {unique.slice(0, 4).map((status) => (
                  <span
                    key={status}
                    className={cn("size-1.5 rounded-full", SESSION_STATUS_DOT[status])}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
      {selectedDay ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Showing {formatDate(selectedDay)}.{" "}
          <Link href={href({})} className="underline-offset-4 hover:underline">
            Show whole month
          </Link>
        </p>
      ) : null}
    </section>
  );
}

export function AttendanceLegend() {
  const items = [
    ["scheduled", "Scheduled"],
    ["attended", "Attended"],
    ["late", "Late"],
    ["missed", "Missed"],
    ["cancelled", "Cancelled"],
  ] as const;

  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(([status, label]) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT[status])} />
          {label}
        </li>
      ))}
    </ul>
  );
}
