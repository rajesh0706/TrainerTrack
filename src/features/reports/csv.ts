import { SESSION_STATUS_LABELS, SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import type { BuiltReport } from "@/features/reports/types";
import { formatDate, formatPercent, formatTime } from "@/lib/format";

function cell(value: string | number | null | undefined) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function table(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [headers.map(cell).join(","), ...rows.map((row) => row.map(cell).join(","))].join(
    "\n",
  );
}

function section(title: string, csv: string) {
  return `# ${title}\n${csv}`;
}

function attendanceCsv(report: Extract<BuiltReport, { kind: "attendance" }>) {
  const summary = table(
    ["metric", "value"],
    [
      ["client", report.clientName],
      ["email", report.clientEmail],
      ["from", report.meta.from],
      ["to", report.meta.to],
      ["scheduled", report.summary.scheduled],
      ["attended", report.summary.attended],
      ["missed", report.summary.missed],
      ["late", report.summary.late],
      ["cancelled", report.summary.cancelled],
      ["attendance_pct", report.summary.rate],
    ],
  );
  const months = table(
    ["month", "scheduled", "attended", "missed", "late", "cancelled", "attendance_pct"],
    report.months.map((month) => [
      month.month,
      month.summary.scheduled,
      month.summary.attended,
      month.summary.missed,
      month.summary.late,
      month.summary.cancelled,
      month.summary.rate,
    ]),
  );
  const sessions = table(
    ["date", "start_time", "duration_min", "type", "status", "notes"],
    report.sessions.map((session) => [
      session.session_date,
      formatTime(session.start_time),
      session.duration_min,
      SESSION_TYPE_LABELS[session.type],
      SESSION_STATUS_LABELS[session.status],
      session.notes,
    ]),
  );
  return [
    section("Summary", summary),
    section("Month breakdown", months),
    section("Sessions", sessions),
  ].join("\n\n");
}

function progressCsv(report: Extract<BuiltReport, { kind: "progress" }>) {
  const metrics = table(
    ["metric", "start", "current", "change", "percent_change", "unit"],
    report.metrics.map((metric) => [
      metric.label,
      metric.start,
      metric.current,
      metric.change,
      metric.percent,
      metric.unit,
    ]),
  );
  const series = report.series
    .map((item) =>
      section(
        item.label,
        table(
          ["date", "value"],
          item.points.map((point) => [point.date, point.value]),
        ),
      ),
    )
    .join("\n\n");
  const notes = table(["trainer_notes"], [[report.notes]]);
  return [section("Measurements", metrics), series, section("Notes", notes)]
    .filter(Boolean)
    .join("\n\n");
}

export function reportToCsv(report: BuiltReport) {
  if (report.kind === "attendance") return attendanceCsv(report);
  if (report.kind === "progress") return progressCsv(report);
  if (report.kind === "summary") {
    return [
      attendanceCsv(report.attendance),
      progressCsv(report.progress),
    ].join("\n\n");
  }
  if (report.kind === "clients-attendance") {
    return table(
      [
        "client",
        "email",
        "sessions",
        "attended",
        "missed",
        "late",
        "cancelled",
        "attendance_pct",
        "last_session",
      ],
      report.rows.map((row) => [
        row.full_name,
        row.email,
        row.total,
        row.attended,
        row.missed,
        row.late,
        row.cancelled,
        row.rate,
        row.last_session,
      ]),
    );
  }
  return table(
    ["metric", "value"],
    [
      ["from", report.meta.from],
      ["to", report.meta.to],
      ["total_sessions", report.totalSessions],
      ["active_clients", report.activeClients],
      ["average_attendance_pct", report.averageAttendance],
      ["new_clients", report.newClients],
      ["archived_clients", report.archivedClients],
    ],
  );
}

export function csvFilename(report: BuiltReport) {
  return `${slug(reportTitle(report))}.csv`;
}

export function reportTitle(report: BuiltReport) {
  if (report.kind === "summary") return report.attendance.meta.title;
  return report.meta.title;
}

export function reportRange(report: BuiltReport) {
  if (report.kind === "summary") return report.attendance.meta;
  return report.meta;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export { formatDate, formatPercent };
