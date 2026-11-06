import type {
  BillingCadence,
  BillingPlanStatus,
  PaymentMethod,
} from "@/lib/supabase/database.types";

export const BILLING_CADENCE_LABELS: Record<BillingCadence, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const BILLING_PLAN_STATUS_LABELS: Record<BillingPlanStatus, string> = {
  active: "Active",
  paused: "Paused",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  other: "Other",
};
