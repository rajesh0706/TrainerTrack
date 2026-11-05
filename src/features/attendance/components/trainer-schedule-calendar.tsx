import Link from "next/link";
import { eachDayOfInterval, format, isSameMonth } from "date-fns";

import { Button, buttonVariants } from "@/components/ui/button";
import { AddSessionButton } from "@/features/attendance/components/add-session-button";
import {
  calendarGridRange,
  isoDate,
  monthBounds,
  monthKey,
  parseIsoDate,
  shiftIsoDate,
  weekBounds,
} from "@/features/attendance/dates";
import { SESSION_STATUS_DOT, SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import type { ClientOption, SessionWithClient } from "@/features/attendance/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function slotClass(session: SessionWithClient, today: string) {
  if (session.status === "cancelled") {
    return "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";
  }
  if (session.session_date > today) {
    return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100";
  }
  if (session.status === "missed") {
    return "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100";
  }
  if (session.status === "late") {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
}

export function TrainerScheduleCalendar({
  view,
  month,
  weekDate,
  selectedDay,
  sessions,
  clients,
}: {
  view: "month" | "week";
  month: Date;
  weekDate: string;
  selectedDay?: string;
  sessions: SessionWithClient[];
  clients: ClientOption[];
}) {
  const today = isoDate(new Date());
  const { previous, next } = monthBounds(month);
  const week = weekBounds(parseIsoDate(weekDate));
  const monthGrid = calendarGridRange(month);
  const gridDays =
    view === "week"
      ? eachDayOfInterval({ start: week.start, end: week.end })
      : eachDayOfInterval({
          start: parseIsoDate(monthGrid.from),
          end: parseIsoDate(monthGrid.to),
        });

  const byDay = new Map<string, SessionWithClient[]>();
  for (const session of sessions) {
    const list = byDay.get(session.session_date) ?? [];
    list.push(session);
    byDay.set(session.session_date, list);
  }

  const rangeFrom = isoDate(gridDays[0]!);
  const rangeTo = isoDate(gridDays.at(-1)!);
  const selectedSessions = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  function href(params: {
    view?: "month" | "week";
    month?: string;
    date?: string;
    day?: string | null;
  }) {
    const search = new URLSearchParams();
    const nextView = params.view ?? view;
    search.set("view", nextView);
    if (nextView === "week") {
      search.set("date", params.date ?? weekDate);
    } else {
      search.set("month", params.month ?? monthKey(month));
    }
    if (params.day) search.set("day", params.day);
    return `/dashboard?${search.toString()}`;
  }

  return (
    <section className="space-y-4" aria-label="Trainer schedule">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Schedule</h2>
          <p className="text-sm text-muted-foreground">
            All clients, past and upcoming. Google Calendar two-way sync comes later;
            download .ics to import for now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={view === "week" ? "default" : "outline"}
            render={
              <Link href={href({ view: "week", date: selectedDay ?? today, day: selectedDay })} />
            }
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={view === "month" ? "default" : "outline"}
            render={
              <Link href={href({ view: "month", month: monthKey(month), day: selectedDay })} />
            }
          >
            Month
          </Button>
          <a
            href={`/api/calendar?from=${rangeFrom}&to=${rangeTo}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Download .ics
          </a>
          <AddSessionButton clients={clients} defaultDate={selectedDay ?? today} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          {view === "week" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={href({ view: "week", date: shiftIsoDate(weekDate, -7), day: null })} />
                }
              >
                Previous
              </Button>
              <h3 className="text-sm font-medium">
                {format(week.start, "d MMM")} – {format(week.end, "d MMM yyyy")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={href({ view: "week", date: shiftIsoDate(weekDate, 7), day: null })} />
                }
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={href({ view: "month", month: previous, day: null })} />}
              >
                Previous
              </Button>
              <h3 className="text-sm font-medium">{format(month, "MMMM yyyy")}</h3>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={href({ view: "month", month: next, day: null })} />}
              >
                Next
              </Button>
            </>
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-7 gap-1",
            view === "week" && "min-w-[640px]",
          )}
        >
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {gridDays.map((day) => {
            const key = isoDate(day);
            const daySessions = byDay.get(key) ?? [];
            const inMonth = view === "week" || isSameMonth(day, month);
            const limit = view === "week" ? 8 : 3;
            const extra = daySessions.length - limit;
            return (
              <Link
                key={key}
                href={href({ day: key, date: key })}
                className={cn(
                  "flex min-h-24 flex-col rounded-lg border border-transparent p-1 text-left hover:bg-muted/70",
                  view === "week" && "min-h-48",
                  !inMonth && "opacity-40",
                  key === today && "ring-1 ring-ring",
                  selectedDay === key && "border-border bg-muted/60",
                  key < today && "bg-muted/20",
                )}
                aria-current={key === today ? "date" : undefined}
                aria-label={`${format(day, "EEEE d MMMM")}, ${daySessions.length} sessions`}
              >
                <span className="mb-1 px-0.5 text-xs font-medium">{format(day, "d")}</span>
                <span className="grid gap-0.5">
                  {daySessions.slice(0, limit).map((session) => (
                    <span
                      key={session.id}
                      className={cn(
                        "truncate rounded border px-1 py-0.5 text-[10px] leading-tight",
                        slotClass(session, today),
                      )}
                    >
                      {formatTime(session.start_time)} {session.client_name}
                    </span>
                  ))}
                  {extra > 0 ? (
                    <span className="px-1 text-[10px] text-muted-foreground">+{extra} more</span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <ScheduleLegend />

      {selectedDay ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-medium">
              {format(parseIsoDate(selectedDay), "EEEE d MMMM yyyy")}
            </h3>
            <Link href={href({ day: null })} className="text-sm underline-offset-4 hover:underline">
              Clear day
            </Link>
          </div>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions this day. Add one to plan the slot.
            </p>
          ) : (
            <ul className="grid gap-2">
              {selectedSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <Link
                      href={`/clients/${session.client_id}/attendance`}
                      className="font-medium hover:underline"
                    >
                      {session.client_name}
                    </Link>
                    <p className="text-muted-foreground">
                      {formatTime(session.start_time)} · {session.duration_min} min ·{" "}
                      {SESSION_TYPE_LABELS[session.type]}
                      {session.session_date > today ? " · Scheduled" : null}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                    <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT[session.status])} />
                    {session.session_date > today ? "Upcoming" : session.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ScheduleLegend() {
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-sky-500" />
        Upcoming
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT.attended)} />
        Attended
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT.late)} />
        Late
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT.missed)} />
        Missed
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", SESSION_STATUS_DOT.cancelled)} />
        Cancelled
      </li>
    </ul>
  );
}
