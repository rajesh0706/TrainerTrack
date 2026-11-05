import { format } from "date-fns";

import { addMinutesToSession, sessionDateTime } from "@/features/attendance/dates";
import { SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import type { SessionWithClient } from "@/features/attendance/types";

function stamp(value: Date) {
  return format(value, "yyyyMMdd'T'HHmmss");
}

function escapeText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

export function sessionsToIcs(sessions: SessionWithClient[], calendarName = "TrainerTrack") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//TrainerTrack//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const session of sessions) {
    const start = sessionDateTime(session.session_date, session.start_time);
    const end = addMinutesToSession(
      session.session_date,
      session.start_time,
      session.duration_min,
    );
    const summary = `${session.client_name} · ${SESSION_TYPE_LABELS[session.type]}`;
    const description = [session.status, session.notes].filter(Boolean).join(" — ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:session-${session.id}@trainertrack`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(summary)}`,
    );
    if (description) {
      lines.push(`DESCRIPTION:${escapeText(description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
