import { format } from "date-fns";

import { summarizeAttendance } from "@/features/attendance/calculations";
import {
  firstAndLastNumeric,
  measurementChange,
} from "@/features/progress/calculations";
import { toNumber } from "@/features/progress/numbers";
import { getReportBranding, imagePathToDataUrl } from "@/features/reports/branding";
import type { ReportQuery } from "@/features/reports/schemas";
import type {
  AttendanceReport,
  BuiltReport,
  BusinessReport,
  ChartSeries,
  MetricRow,
  MonthBreakdown,
  ProgressReport,
  RosterReport,
  SessionRow,
  SummaryReport,
} from "@/features/reports/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  Client,
  Measurement,
  Session,
  SessionStatus,
} from "@/lib/supabase/database.types";

const METRICS: Array<{
  key: keyof Measurement;
  label: string;
  unit: string;
}> = [
  { key: "weight_kg", label: "Weight", unit: "kg" },
  { key: "body_fat_pct", label: "Body fat", unit: "%" },
  { key: "chest_cm", label: "Chest", unit: "cm" },
  { key: "waist_cm", label: "Waist", unit: "cm" },
  { key: "hips_cm", label: "Hips", unit: "cm" },
  { key: "arm_cm", label: "Arm", unit: "cm" },
  { key: "thigh_cm", label: "Thigh", unit: "cm" },
];

function metaTitle(type: ReportQuery["type"], clientName?: string) {
  const titles = {
    attendance: "Client Attendance Report",
    progress: "Client Progress Report",
    summary: "Client Summary",
    "clients-attendance": "All-Clients Attendance Summary",
    business: "Monthly Business Report",
  };
  return clientName ? `${titles[type]} · ${clientName}` : titles[type];
}

function monthGroups(statusesByMonth: Map<string, SessionStatus[]>): MonthBreakdown[] {
  return [...statusesByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, statuses]) => ({
      month,
      summary: summarizeAttendance(statuses),
    }));
}

function toSessionRow(session: Session, clientName?: string): SessionRow {
  return {
    session_date: session.session_date,
    start_time: session.start_time,
    duration_min: session.duration_min,
    type: session.type,
    status: session.status,
    notes: session.notes,
    client_name: clientName,
  };
}

async function loadClientForUser(user: CurrentUser, clientId: string) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("clients").select("*").eq("id", clientId);
  if (user.profile.role === "trainer") {
    query = query.eq("trainer_id", user.id);
  } else {
    query = query.eq("profile_id", user.id);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data as Client | null;
}

function trainerIdFor(user: CurrentUser, client: Client | null) {
  return user.profile.role === "trainer" ? user.id : client?.trainer_id;
}

export async function listReportClients(trainerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, status")
    .eq("trainer_id", trainerId)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buildReport(
  user: CurrentUser,
  query: ReportQuery,
): Promise<BuiltReport> {
  if (
    (query.type === "clients-attendance" || query.type === "business") &&
    user.profile.role !== "trainer"
  ) {
    throw new Error("This report is available to trainers only");
  }

  const generatedOn = format(new Date(), "d MMM yyyy HH:mm");

  if (query.type === "attendance") {
    return loadAttendance(user, query, generatedOn);
  }
  if (query.type === "progress") {
    return loadProgress(user, query, generatedOn);
  }
  if (query.type === "summary") {
    const [attendance, progress] = await Promise.all([
      loadAttendance(user, query, generatedOn),
      loadProgress(user, query, generatedOn),
    ]);
    const summary: SummaryReport = {
      kind: "summary",
      attendance: {
        ...attendance,
        meta: { ...attendance.meta, title: metaTitle("summary", attendance.clientName) },
      },
      progress: {
        ...progress,
        meta: { ...progress.meta, title: metaTitle("summary", progress.clientName) },
      },
    };
    return summary;
  }
  if (query.type === "clients-attendance") {
    return loadRoster(user, query, generatedOn);
  }
  return loadBusiness(user, query, generatedOn);
}

async function loadAttendance(
  user: CurrentUser,
  query: ReportQuery,
  generatedOn: string,
): Promise<AttendanceReport> {
  const client = await loadClientForUser(user, query.clientId!);
  if (!client) throw new Error("Client not found");
  const trainerId = trainerIdFor(user, client);
  if (!trainerId) throw new Error("Client not found");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", client.id)
    .eq("trainer_id", trainerId)
    .gte("session_date", query.from)
    .lte("session_date", query.to)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);
  const sessions = (data ?? []) as Session[];
  const byMonth = new Map<string, SessionStatus[]>();
  for (const session of sessions) {
    const key = session.session_date.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(session.status);
    byMonth.set(key, list);
  }

  const branding = await getReportBranding(trainerId);
  return {
    kind: "attendance",
    meta: {
      title: metaTitle("attendance", client.full_name),
      from: query.from,
      to: query.to,
      generatedOn,
      branding,
    },
    clientName: client.full_name,
    clientEmail: client.email,
    summary: summarizeAttendance(sessions.map((session) => session.status)),
    months: monthGroups(byMonth),
    sessions: sessions.map((session) => toSessionRow(session)),
  };
}

async function loadProgress(
  user: CurrentUser,
  query: ReportQuery,
  generatedOn: string,
): Promise<ProgressReport> {
  const client = await loadClientForUser(user, query.clientId!);
  if (!client) throw new Error("Client not found");
  const trainerId = trainerIdFor(user, client);
  if (!trainerId) throw new Error("Client not found");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", client.id)
    .gte("measured_on", query.from)
    .lte("measured_on", query.to)
    .order("measured_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const measurements = ((data ?? []) as Measurement[]).map((row) => ({
    ...row,
    weight_kg: toNumber(row.weight_kg),
    body_fat_pct: toNumber(row.body_fat_pct),
    chest_cm: toNumber(row.chest_cm),
    waist_cm: toNumber(row.waist_cm),
    hips_cm: toNumber(row.hips_cm),
    arm_cm: toNumber(row.arm_cm),
    thigh_cm: toNumber(row.thigh_cm),
  }));

  const metrics: MetricRow[] = METRICS.map((metric) => {
    const values = measurements.map((row) => toNumber(row[metric.key]));
    const { first, last } = firstAndLastNumeric(values);
    const change = measurementChange(first, last);
    return {
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      start: first,
      current: last,
      change: change?.change ?? null,
      percent: change?.percent ?? null,
    };
  });

  const series: ChartSeries[] = METRICS.map((metric) => ({
    key: metric.key,
    label: `${metric.label} (${metric.unit})`,
    points: measurements
      .map((row) => {
        const value = toNumber(row[metric.key]);
        return value == null ? null : { date: row.measured_on, value };
      })
      .filter((point): point is { date: string; value: number } => point != null),
  })).filter((item) => item.points.length > 0);

  const photos: ProgressReport["photos"] = [];
  if (query.includePhotos !== false) {
    const { data: photoRows } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("client_id", client.id)
      .gte("taken_on", query.from)
      .lte("taken_on", query.to)
      .order("taken_on", { ascending: true });

    const list = photoRows ?? [];
    const pair = list.length >= 2 ? [list[0], list[list.length - 1]] : list.slice(0, 1);
    for (const photo of pair) {
      if (!photo) continue;
      const dataUrl = await imagePathToDataUrl(photo.storage_path);
      if (!dataUrl) continue;
      photos.push({
        label: photo.label,
        taken_on: photo.taken_on,
        dataUrl,
      });
    }
  }

  const branding = await getReportBranding(trainerId);
  return {
    kind: "progress",
    meta: {
      title: metaTitle("progress", client.full_name),
      from: query.from,
      to: query.to,
      generatedOn,
      branding,
    },
    clientName: client.full_name,
    clientEmail: client.email,
    notes: client.notes,
    metrics,
    series,
    photos,
  };
}

async function loadRoster(
  user: CurrentUser,
  query: ReportQuery,
  generatedOn: string,
): Promise<RosterReport> {
  const supabase = await createServerSupabaseClient();
  const [{ data: clients, error: clientError }, { data: sessions, error: sessionError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, email, status")
        .eq("trainer_id", user.id)
        .order("full_name"),
      supabase
        .from("sessions")
        .select("client_id, status, session_date")
        .eq("trainer_id", user.id)
        .gte("session_date", query.from)
        .lte("session_date", query.to),
    ]);

  if (clientError) throw new Error(clientError.message);
  if (sessionError) throw new Error(sessionError.message);

  const grouped = new Map<
    string,
    { statuses: SessionStatus[]; last: string | null }
  >();
  for (const session of sessions ?? []) {
    const current = grouped.get(session.client_id) ?? { statuses: [], last: null };
    current.statuses.push(session.status);
    if (!current.last || session.session_date > current.last) {
      current.last = session.session_date;
    }
    grouped.set(session.client_id, current);
  }

  const branding = await getReportBranding(user.id);
  return {
    kind: "clients-attendance",
    meta: {
      title: metaTitle("clients-attendance"),
      from: query.from,
      to: query.to,
      generatedOn,
      branding,
    },
    rows: (clients ?? []).map((client) => {
      const group = grouped.get(client.id);
      const summary = summarizeAttendance(group?.statuses ?? []);
      return {
        client_id: client.id,
        full_name: client.full_name,
        email: client.email,
        total: summary.total,
        attended: summary.attended,
        missed: summary.missed,
        late: summary.late,
        cancelled: summary.cancelled,
        scheduled: summary.scheduled,
        rate: summary.rate,
        last_session: group?.last ?? null,
      };
    }),
  };
}

async function loadBusiness(
  user: CurrentUser,
  query: ReportQuery,
  generatedOn: string,
): Promise<BusinessReport> {
  const supabase = await createServerSupabaseClient();
  const [clientsResult, sessionsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, status, created_at")
      .eq("trainer_id", user.id),
    supabase
      .from("sessions")
      .select("status, session_date")
      .eq("trainer_id", user.id)
      .gte("session_date", query.from)
      .lte("session_date", query.to),
  ]);

  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  const clients = clientsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const byMonth = new Map<string, SessionStatus[]>();
  for (const session of sessions) {
    const key = session.session_date.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(session.status);
    byMonth.set(key, list);
  }

  const branding = await getReportBranding(user.id);
  return {
    kind: "business",
    meta: {
      title: metaTitle("business"),
      from: query.from,
      to: query.to,
      generatedOn,
      branding,
    },
    totalSessions: sessions.length,
    activeClients: clients.filter((client) => client.status === "active").length,
    averageAttendance: summarizeAttendance(sessions.map((session) => session.status)).rate,
    newClients: clients.filter(
      (client) =>
        client.created_at.slice(0, 10) >= query.from &&
        client.created_at.slice(0, 10) <= query.to,
    ).length,
    archivedClients: clients.filter((client) => client.status === "archived").length,
    months: monthGroups(byMonth),
  };
}
