import { z } from "zod";

export const SESSION_STATUSES = [
  "attended",
  "missed",
  "cancelled",
  "late",
] as const;
export const SESSION_TYPES = ["personal", "group", "online"] as const;
export const QUICK_STATUSES = ["attended", "missed", "late"] as const;

export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export const sessionTypeSchema = z.enum(SESSION_TYPES);

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Enter a valid time");

export const sessionFormSchema = z.object({
  client_id: z.string().uuid("Choose a client"),
  session_date: z.string().min(1, "Choose a date"),
  start_time: timeSchema,
  duration_min: z.coerce
    .number()
    .int()
    .min(15, "Minimum 15 minutes")
    .max(240, "Maximum 4 hours"),
  type: sessionTypeSchema,
  status: sessionStatusSchema,
  notes: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.string().max(2000).nullable()),
});

export const sessionStatusUpdateSchema = z.object({
  sessionId: z.string().uuid(),
  status: sessionStatusSchema,
});

export const bulkStatusSchema = z.object({
  sessionIds: z.array(z.string().uuid()).min(1, "Select at least one session"),
  status: sessionStatusSchema,
});

export type SessionFormInput = z.input<typeof sessionFormSchema>;
