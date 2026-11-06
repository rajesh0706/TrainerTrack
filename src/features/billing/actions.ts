"use server";

import { revalidatePath } from "next/cache";

import {
  asMoney,
  paymentAdvancesPlan,
  periodCoveredByPayment,
} from "@/features/billing/calculations";
import {
  billingPlanFormSchema,
  paymentFormSchema,
} from "@/features/billing/schemas";
import { canAccessClient } from "@/features/clients/access";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BillingPlan, Payment } from "@/lib/supabase/database.types";

type PlanResult = { error: string | null; plan?: BillingPlan };
type PaymentResult = { error: string | null; payment?: Payment };

function revalidateBilling(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/billing`);
}

export async function saveBillingPlanAction(input: unknown): Promise<PlanResult> {
  const user = await requireRole("trainer");
  const parsed = billingPlanFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid billing plan" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };

  const payload = {
    client_id: parsed.data.client_id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    cadence: parsed.data.cadence,
    starts_on: parsed.data.starts_on,
    next_due_on: parsed.data.next_due_on,
    status: parsed.data.status,
    notes: parsed.data.notes,
  };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("billing_plans")
    .upsert(payload, { onConflict: "client_id" })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateBilling(parsed.data.client_id);
  return { error: null, plan: { ...(data as BillingPlan), amount: asMoney(data.amount) } };
}

export async function recordPaymentAction(input: unknown): Promise<PaymentResult> {
  const user = await requireRole("trainer");
  const parsed = paymentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { data: planRow, error: planError } = await supabase
    .from("billing_plans")
    .select("*")
    .eq("client_id", parsed.data.client_id)
    .maybeSingle();

  if (planError) return { error: planError.message };
  if (!planRow) return { error: "Save a billing plan before recording a payment" };

  const plan = planRow as BillingPlan;
  const period = periodCoveredByPayment(plan.next_due_on, plan.cadence);

  const { data, error } = await supabase
    .from("payments")
    .insert({
      client_id: parsed.data.client_id,
      paid_on: parsed.data.paid_on,
      amount: parsed.data.amount,
      currency: plan.currency,
      period_start: period.period_start,
      period_end: period.period_end,
      method: parsed.data.method,
      notes: parsed.data.notes,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  const { error: dueError } = await supabase
    .from("billing_plans")
    .update({ next_due_on: period.next_due_on })
    .eq("client_id", parsed.data.client_id);

  if (dueError) {
    await supabase.from("payments").delete().eq("id", data.id);
    return { error: dueError.message };
  }

  revalidateBilling(parsed.data.client_id);
  return {
    error: null,
    payment: { ...(data as Payment), amount: asMoney(data.amount) },
  };
}

export async function updatePaymentAction(
  paymentId: string,
  input: unknown,
): Promise<PaymentResult> {
  const user = await requireRole("trainer");
  const parsed = paymentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  }

  const client = await canAccessClient(user, parsed.data.client_id);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .update({
      paid_on: parsed.data.paid_on,
      amount: parsed.data.amount,
      method: parsed.data.method,
      notes: parsed.data.notes,
    })
    .eq("id", paymentId)
    .eq("client_id", parsed.data.client_id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidateBilling(parsed.data.client_id);
  return {
    error: null,
    payment: { ...(data as Payment), amount: asMoney(data.amount) },
  };
}

export async function deletePaymentAction(
  paymentId: string,
  clientId: string,
): Promise<{ error: string | null }> {
  const user = await requireRole("trainer");
  const client = await canAccessClient(user, clientId);
  if (!client) return { error: "Client not found" };

  const supabase = await createServerSupabaseClient();
  const [{ data: payment, error: paymentError }, { data: plan, error: planError }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .eq("client_id", clientId)
        .maybeSingle(),
      supabase.from("billing_plans").select("*").eq("client_id", clientId).maybeSingle(),
    ]);

  if (paymentError) return { error: paymentError.message };
  if (planError) return { error: planError.message };
  if (!payment) return { error: "Payment not found" };

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("client_id", clientId);

  if (error) return { error: error.message };

  if (
    plan &&
    paymentAdvancesPlan(
      (plan as BillingPlan).next_due_on,
      (payment as Payment).period_start,
      (plan as BillingPlan).cadence,
    )
  ) {
    const { error: dueError } = await supabase
      .from("billing_plans")
      .update({ next_due_on: (payment as Payment).period_start })
      .eq("client_id", clientId);
    if (dueError) return { error: dueError.message };
  }

  revalidateBilling(clientId);
  return { error: null };
}
