import { addDays, addMonths, addYears } from "date-fns";

import { isoDate, parseIsoDate } from "@/features/attendance/dates";
import type { BillingCadence, BillingPlanStatus } from "@/lib/supabase/database.types";

export function addCadence(iso: string, cadence: BillingCadence): string {
  const date = parseIsoDate(iso);
  if (cadence === "monthly") return isoDate(addMonths(date, 1));
  if (cadence === "quarterly") return isoDate(addMonths(date, 3));
  return isoDate(addYears(date, 1));
}

export function periodCoveredByPayment(
  nextDueOn: string,
  cadence: BillingCadence,
) {
  const period_start = nextDueOn;
  const next_due_on = addCadence(nextDueOn, cadence);
  const period_end = isoDate(addDays(parseIsoDate(next_due_on), -1));
  return { period_start, period_end, next_due_on };
}

export function paymentAdvancesPlan(
  nextDueOn: string,
  periodStart: string,
  cadence: BillingCadence,
) {
  return nextDueOn === addCadence(periodStart, cadence);
}

export function isBillingOverdue(
  nextDueOn: string,
  today: string,
  status: BillingPlanStatus,
) {
  return status === "active" && nextDueOn < today;
}

export function asMoney(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}
