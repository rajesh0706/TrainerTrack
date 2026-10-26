import { cache } from "react";
import { notFound } from "next/navigation";

import { summarizeAttendance } from "@/features/attendance/calculations";
import {
  clientListQuerySchema,
  type ClientListQuery,
} from "@/features/clients/schemas";
import {
  firstAndLastNumeric,
  measurementChange,
} from "@/features/progress/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Client, ClientStatus } from "@/lib/supabase/database.types";

export const CLIENT_PAGE_SIZE = 20;

export function parseClientListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ClientListQuery {
  const raw = {
    q: single(searchParams.q),
    status: single(searchParams.status),
    sort: single(searchParams.sort),
    dir: single(searchParams.dir),
    page: single(searchParams.page),
  };
  const parsed = clientListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return clientListQuerySchema.parse({});
  }
  return parsed.data;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listTrainerClients(
  trainerId: string,
  query: ClientListQuery,
) {
  const supabase = await createServerSupabaseClient();
  const from = (query.page - 1) * CLIENT_PAGE_SIZE;
  const to = from + CLIENT_PAGE_SIZE - 1;

  let request = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("trainer_id", trainerId);

  if (query.status !== "all") {
    request = request.eq("status", query.status as ClientStatus);
  }

  if (query.q) {
    const term = query.q.replaceAll(",", " ").replaceAll("%", "");
    request = request.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.dir === "asc" })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    clients: (data ?? []) as Client[],
    total: count ?? 0,
    page: query.page,
    pageSize: CLIENT_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / CLIENT_PAGE_SIZE)),
  };
}

export const getTrainerClient = cache(async function getTrainerClient(
  trainerId: string,
  clientId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();
  return data as Client;
});

export const getClientOverviewStats = cache(async function getClientOverviewStats(
  clientId: string,
) {
  const supabase = await createServerSupabaseClient();
  const [sessionsResult, measurementsResult] = await Promise.all([
    supabase.from("sessions").select("status").eq("client_id", clientId),
    supabase
      .from("measurements")
      .select("measured_on, weight_kg")
      .eq("client_id", clientId)
      .order("measured_on", { ascending: true }),
  ]);

  if (sessionsResult.error) throw new Error(sessionsResult.error.message);
  if (measurementsResult.error) {
    throw new Error(measurementsResult.error.message);
  }

  const attendance = summarizeAttendance(
    (sessionsResult.data ?? []).map((row) => row.status),
  );
  const weights = (measurementsResult.data ?? []).map((row) => row.weight_kg);
  const { first, last } = firstAndLastNumeric(weights);

  return {
    attendance,
    weight: measurementChange(first, last),
    measurementCount: measurementsResult.data?.length ?? 0,
  };
});
