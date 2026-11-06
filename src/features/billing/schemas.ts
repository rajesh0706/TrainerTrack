import { z } from "zod";

export const BILLING_CADENCES = ["monthly", "quarterly", "yearly"] as const;
export const BILLING_PLAN_STATUSES = ["active", "paused"] as const;
export const PAYMENT_METHODS = ["cash", "upi", "card", "other"] as const;
export const BILLING_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD"] as const;

const moneySchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (value === "") return Number.NaN;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine((value) => value > 0, "Enter an amount greater than 0")
  .refine((value) => value <= 1_000_000, "Amount is too large");

const optionalNotes = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.string().max(2000).nullable());

export const billingPlanFormSchema = z.object({
  client_id: z.string().uuid(),
  amount: moneySchema,
  currency: z.enum(BILLING_CURRENCIES),
  cadence: z.enum(BILLING_CADENCES),
  starts_on: z.string().min(1, "Choose a start date"),
  next_due_on: z.string().min(1, "Choose the next due date"),
  status: z.enum(BILLING_PLAN_STATUSES),
  notes: optionalNotes,
});

export const paymentFormSchema = z.object({
  client_id: z.string().uuid(),
  paid_on: z.string().min(1, "Choose a date"),
  amount: moneySchema,
  method: z.enum(PAYMENT_METHODS),
  notes: optionalNotes,
});

export type BillingPlanFormInput = z.input<typeof billingPlanFormSchema>;
export type PaymentFormInput = z.input<typeof paymentFormSchema>;
