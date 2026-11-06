import { asMoney } from "@/features/billing/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BillingPlan, Payment } from "@/lib/supabase/database.types";

function asPlan(row: BillingPlan): BillingPlan {
  return { ...row, amount: asMoney(row.amount) };
}

function asPayment(row: Payment): Payment {
  return { ...row, amount: asMoney(row.amount) };
}

export async function getBillingPlan(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("billing_plans")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? asPlan(data as BillingPlan) : null;
}

export async function listPayments(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", clientId)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asPayment(row as Payment));
}
