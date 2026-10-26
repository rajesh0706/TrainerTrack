import type { AttendanceSummary } from "@/features/attendance/calculations";
import type { ReportBranding } from "@/features/reports/branding";
import type { SessionStatus, SessionType } from "@/lib/supabase/database.types";

export type ReportMeta = {
  title: string;
  from: string;
  to: string;
  generatedOn: string;
  branding: ReportBranding;
};

export type SessionRow = {
  session_date: string;
  start_time: string;
  duration_min: number;
  type: SessionType;
  status: SessionStatus;
  notes: string | null;
  client_name?: string;
};

export type MonthBreakdown = {
  month: string;
  summary: AttendanceSummary;
};

export type MetricRow = {
  key: string;
  label: string;
  unit: string;
  start: number | null;
  current: number | null;
  change: number | null;
  percent: number | null;
};

export type ChartSeries = {
  key: string;
  label: string;
  points: Array<{ date: string; value: number }>;
};

export type PhotoPair = {
  label: string;
  taken_on: string;
  dataUrl: string;
};

export type AttendanceReport = {
  kind: "attendance";
  meta: ReportMeta;
  clientName: string;
  clientEmail: string;
  summary: AttendanceSummary;
  months: MonthBreakdown[];
  sessions: SessionRow[];
};

export type ProgressReport = {
  kind: "progress";
  meta: ReportMeta;
  clientName: string;
  clientEmail: string;
  notes: string | null;
  metrics: MetricRow[];
  series: ChartSeries[];
  photos: PhotoPair[];
};

export type SummaryReport = {
  kind: "summary";
  attendance: AttendanceReport;
  progress: ProgressReport;
};

export type RosterRow = {
  client_id: string;
  full_name: string;
  email: string;
  total: number;
  attended: number;
  missed: number;
  late: number;
  cancelled: number;
  scheduled: number;
  rate: number | null;
  last_session: string | null;
};

export type RosterReport = {
  kind: "clients-attendance";
  meta: ReportMeta;
  rows: RosterRow[];
};

export type BusinessReport = {
  kind: "business";
  meta: ReportMeta;
  totalSessions: number;
  activeClients: number;
  averageAttendance: number | null;
  newClients: number;
  archivedClients: number;
  months: MonthBreakdown[];
};

export type BuiltReport =
  | AttendanceReport
  | ProgressReport
  | SummaryReport
  | RosterReport
  | BusinessReport;
