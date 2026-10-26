import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { summarizeAttendance } from "@/features/attendance/calculations";
import { isoDate, WEEK_STARTS_ON } from "@/features/attendance/dates";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ClientOption, SessionWithClient } from "@/features/attendance/types";
import type { Session, SessionStatus } from "@/lib/supabase/database.types";

export type { ClientOption, SessionWithClient };

const LOW_ATTENDANCE_THRESHOLD = 60;

function mergeSessions(
  sessions: Session[],
  clients: ClientOption[],
): SessionWithClient[] {
  const names = new Map(clients.map((client) => [client.id, client]));
  return sessions.map((session) => {
    const client = names.get(session.client_id);
    return {
      ...session,
      client_name: client?.full_name ?? "Unknown client",
      client_status: client?.status ?? "active",
    };
  });
}

export async function listTrainerClientOptions(trainerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, status")
    .eq("trainer_id", trainerId)
    .neq("status", "archived")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ClientOption[];
}

export async function listSessionsInRange(
  trainerId: string,
  from: string,
  to: string,
  clientId?: string,
) {
  const supabase = await createServerSupabaseClient();
  let request = supabase
    .from("sessions")
    .select("*")
    .eq("trainer_id", trainerId)
    .gte("session_date", from)
    .lte("session_date", to)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (clientId) {
    request = request.eq("client_id", clientId);
  }

  const [{ data: sessions, error: sessionError }, { data: clients, error: clientError }] =
    await Promise.all([
      request,
      supabase
        .from("clients")
        .select("id, full_name, status")
        .eq("trainer_id", trainerId),
    ]);

  if (sessionError) throw new Error(sessionError.message);
  if (clientError) throw new Error(clientError.message);

  return mergeSessions((sessions ?? []) as Session[], (clients ?? []) as ClientOption[]);
}

export async function getTrainerDashboard(trainerId: string) {
  const supabase = await createServerSupabaseClient();
  const today = new Date();
  const todayIso = isoDate(today);
  const weekStart = isoDate(startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }));
  const weekEnd = isoDate(endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }));
  const monthStart = isoDate(startOfMonth(today));
  const monthEnd = isoDate(endOfMonth(today));
  const windowStart = weekStart < monthStart ? weekStart : monthStart;
  const windowEnd = weekEnd > monthEnd ? weekEnd : monthEnd;

  const [clientsResult, windowResult, recentResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, status")
      .eq("trainer_id", trainerId),
    supabase
      .from("sessions")
      .select("id, client_id, session_date, start_time, duration_min, type, status, notes, trainer_id, created_at")
      .eq("trainer_id", trainerId)
      .gte("session_date", windowStart)
      .lte("session_date", windowEnd),
    supabase
      .from("sessions")
      .select("id, client_id, session_date, start_time, duration_min, type, status, notes, trainer_id, created_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (windowResult.error) throw new Error(windowResult.error.message);
  if (recentResult.error) throw new Error(recentResult.error.message);

  const clients = (clientsResult.data ?? []) as ClientOption[];
  const windowSessions = (windowResult.data ?? []) as Session[];
  const recentSessions = mergeSessions(
    (recentResult.data ?? []) as Session[],
    clients,
  );

  const activeClients = clients.filter((client) => client.status === "active");
  const weekSessions = windowSessions.filter(
    (session) => session.session_date >= weekStart && session.session_date <= weekEnd,
  );
  const monthSessions = windowSessions.filter(
    (session) => session.session_date >= monthStart && session.session_date <= monthEnd,
  );
  const monthAttendance = summarizeAttendance(monthSessions.map((session) => session.status));

  const byClient = new Map<string, SessionStatus[]>();
  for (const session of monthSessions) {
    const list = byClient.get(session.client_id) ?? [];
    list.push(session.status);
    byClient.set(session.client_id, list);
  }

  const lowAttendance = clients
    .map((client) => {
      const summary = summarizeAttendance(byClient.get(client.id) ?? []);
      return {
        id: client.id,
        full_name: client.full_name,
        rate: summary.rate,
        scheduled: summary.scheduled,
      };
    })
    .filter(
      (row) =>
        row.scheduled > 0 &&
        row.rate != null &&
        row.rate < LOW_ATTENDANCE_THRESHOLD,
    )
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0));

  const todaysSessions = mergeSessions(
    windowSessions.filter((session) => session.session_date === todayIso),
    clients,
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return {
    activeClientCount: activeClients.length,
    sessionsThisWeek: weekSessions.length,
    monthAttendance,
    lowAttendance,
    todaysSessions,
    recentSessions,
  };
}
