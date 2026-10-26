"use server";

import { revalidatePath } from "next/cache";

import { normalizeTime } from "@/features/attendance/dates";
import {
  bulkStatusSchema,
  sessionFormSchema,
  sessionStatusSchema,
} from "@/features/attendance/schemas";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Session, SessionStatus } from "@/lib/supabase/database.types";

type ActionResult = { error: string | null; session?: Session };

function uniqueMessage(message: string) {
  if (message.includes("sessions_unique_attendance")) {
    return "That client already has a session at this date and time.";
  }
  return message;
}

function revalidateAttendance(clientId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/attendance`);
}

async function assertOwnedClient(trainerId: string, clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .maybeSingle();
  return Boolean(data);
}

function payloadFromInput(
  trainerId: string,
  input: ReturnType<typeof sessionFormSchema.parse>,
) {
  return {
    trainer_id: trainerId,
    client_id: input.client_id,
    session_date: input.session_date,
    start_time: normalizeTime(input.start_time),
    duration_min: input.duration_min,
    type: input.type,
    status: input.status,
    notes: input.notes,
  };
}

export async function createSessionAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const parsed = sessionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid session" };
  }
  if (!(await assertOwnedClient(user.id, parsed.data.client_id))) {
    return { error: "Client not found" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert(payloadFromInput(user.id, parsed.data))
    .select("*")
    .single();

  if (error) return { error: uniqueMessage(error.message) };
  revalidateAttendance(parsed.data.client_id);
  return { error: null, session: data as Session };
}

export async function updateSessionAction(
  sessionId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const parsed = sessionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid session" };
  }
  if (!(await assertOwnedClient(user.id, parsed.data.client_id))) {
    return { error: "Client not found" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .update(payloadFromInput(user.id, parsed.data))
    .eq("id", sessionId)
    .eq("trainer_id", user.id)
    .select("*")
    .single();

  if (error) return { error: uniqueMessage(error.message) };
  revalidateAttendance(parsed.data.client_id);
  return { error: null, session: data as Session };
}

export async function setSessionStatusAction(
  sessionId: string,
  status: SessionStatus,
): Promise<ActionResult> {
  const user = await requireRole("trainer");
  const parsed = sessionStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({ status: parsed.data })
    .eq("id", sessionId)
    .eq("trainer_id", user.id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Session not found" };
  revalidateAttendance(data.client_id);
  return { error: null, session: data as Session };
}

export async function bulkSetSessionStatusAction(
  sessionIds: string[],
  status: SessionStatus,
): Promise<{ error: string | null; updated: number }> {
  const user = await requireRole("trainer");
  const parsed = bulkStatusSchema.safeParse({ sessionIds, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid selection", updated: 0 };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({ status: parsed.data.status })
    .in("id", parsed.data.sessionIds)
    .eq("trainer_id", user.id)
    .select("id, client_id");

  if (error) return { error: error.message, updated: 0 };

  const clientIds = new Set((data ?? []).map((row) => row.client_id));
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  for (const clientId of clientIds) {
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/attendance`);
  }
  return { error: null, updated: data?.length ?? 0 };
}

export async function deleteSessionAction(
  sessionId: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("trainer_id", user.id)
    .select("client_id")
    .single();

  if (error) return { error: error.message };
  if (data) revalidateAttendance(data.client_id);
  return { error: null };
}
