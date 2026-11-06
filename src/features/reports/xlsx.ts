import * as XLSX from "xlsx";

import { SESSION_STATUS_LABELS, SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import { reportRange, reportTitle } from "@/features/reports/csv";
import type { BuiltReport } from "@/features/reports/types";
import { formatTime } from "@/lib/format";

function sheet(name: string, rows: Array<Array<string | number | null | undefined>>) {
  const normalized = rows.map((row) =>
    row.map((cell) => (cell == null ? "" : cell)),
  );
  const ws = XLSX.utils.aoa_to_sheet(normalized);
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const header = XLSX.utils.encode_cell({ r: 0, c: column });
    if (ws[header]) {
      ws[header].s = { font: { bold: true } };
    }
  }
  return { name: name.slice(0, 31), ws };
}

function attendanceSheets(report: Extract<BuiltReport, { kind: "attendance" }>) {
  return [
    sheet("Summary", [
      ["Metric", "Value"],
      ["Client", report.clientName],
      ["Email", report.clientEmail],
      ["From", report.meta.from],
      ["To", report.meta.to],
      ["Counted", report.summary.scheduled],
      ["Attended", report.summary.attended],
      ["Missed", report.summary.missed],
      ["Late", report.summary.late],
      ["Cancelled", report.summary.cancelled],
      ["Upcoming", report.summary.planned],
      ["Attendance %", report.summary.rate],
    ]),
    sheet("By month", [
      [
        "Month",
        "Counted",
        "Attended",
        "Missed",
        "Late",
        "Cancelled",
        "Upcoming",
        "Attendance %",
      ],
      ...report.months.map((month) => [
        month.month,
        month.summary.scheduled,
        month.summary.attended,
        month.summary.missed,
        month.summary.late,
        month.summary.cancelled,
        month.summary.planned,
        month.summary.rate,
      ]),
    ]),
    sheet("Sessions", [
      ["Date", "Start", "Duration (min)", "Type", "Status", "Notes"],
      ...report.sessions.map((session) => [
        session.session_date,
        formatTime(session.start_time),
        session.duration_min,
        SESSION_TYPE_LABELS[session.type],
        SESSION_STATUS_LABELS[session.status],
        session.notes,
      ]),
    ]),
  ];
}

function progressSheets(report: Extract<BuiltReport, { kind: "progress" }>) {
  const sheets = [
    sheet("Measurements", [
      ["Metric", "Start", "Current", "Change", "% change", "Unit"],
      ...report.metrics.map((metric) => [
        metric.label,
        metric.start,
        metric.current,
        metric.change,
        metric.percent,
        metric.unit,
      ]),
    ]),
    sheet("Notes", [["Trainer notes"], [report.notes]]),
  ];
  for (const series of report.series) {
    sheets.push(
      sheet(series.label, [
        ["Date", "Value"],
        ...series.points.map((point) => [point.date, point.value]),
      ]),
    );
  }
  return sheets;
}

export function reportToXlsx(report: BuiltReport) {
  const workbook = XLSX.utils.book_new();
  const sheets =
    report.kind === "attendance"
      ? attendanceSheets(report)
      : report.kind === "progress"
        ? progressSheets(report)
        : report.kind === "summary"
          ? [
              ...attendanceSheets(report.attendance),
              ...progressSheets(report.progress),
            ]
          : report.kind === "clients-attendance"
            ? [
                sheet("Clients", [
                  [
                    "Client",
                    "Email",
                    "Sessions",
                    "Attended",
                    "Missed",
                    "Late",
                    "Cancelled",
                    "Attendance %",
                    "Last session",
                  ],
                  ...report.rows.map((row) => [
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
                ]),
              ]
            : [
                sheet("Business", [
                  ["Metric", "Value"],
                  ["From", report.meta.from],
                  ["To", report.meta.to],
                  ["Total sessions", report.totalSessions],
                  ["Active clients", report.activeClients],
                  ["Average attendance %", report.averageAttendance],
                  ["New clients", report.newClients],
                  ["Archived clients", report.archivedClients],
                ]),
                sheet("By month", [
                  [
                    "Month",
                    "Scheduled",
                    "Attended",
                    "Missed",
                    "Late",
                    "Cancelled",
                    "Attendance %",
                  ],
                  ...report.months.map((month) => [
                    month.month,
                    month.summary.scheduled,
                    month.summary.attended,
                    month.summary.missed,
                    month.summary.late,
                    month.summary.cancelled,
                    month.summary.rate,
                  ]),
                ]),
              ];

  const used = new Set<string>();
  for (const item of sheets) {
    let name = item.name;
    let index = 2;
    while (used.has(name)) {
      name = `${item.name.slice(0, 28)}-${index}`;
      index += 1;
    }
    used.add(name);
    XLSX.utils.book_append_sheet(workbook, item.ws, name);
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function xlsxFilename(report: BuiltReport) {
  const meta = reportRange(report);
  const base = reportTitle(report)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${meta.from}-to-${meta.to}.xlsx`;
}
