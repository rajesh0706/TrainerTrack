import { z } from "zod";

export const REPORT_TYPES = [
  "attendance",
  "progress",
  "summary",
  "clients-attendance",
  "business",
] as const;

export const REPORT_FORMATS = ["pdf", "xlsx", "csv"] as const;
export const RANGE_PRESETS = [
  "this_week",
  "this_month",
  "last_3_months",
  "custom",
] as const;

export const CLIENT_REPORTS = ["attendance", "progress", "summary"] as const;
export const TRAINER_ONLY_REPORTS = [
  "clients-attendance",
  "business",
] as const;

export const reportQuerySchema = z
  .object({
    type: z.enum(REPORT_TYPES),
    format: z.enum(REPORT_FORMATS),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid from date"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid to date"),
    clientId: z.string().uuid().optional(),
    includePhotos: z
      .enum(["0", "1", "true", "false"])
      .optional()
      .transform((value) => value === "1" || value === "true"),
  })
  .refine((value) => value.from <= value.to, {
    message: "Start date must be on or before end date",
    path: ["from"],
  })
  .refine(
    (value) =>
      !CLIENT_REPORTS.includes(value.type as (typeof CLIENT_REPORTS)[number]) ||
      Boolean(value.clientId),
    { message: "clientId is required for this report", path: ["clientId"] },
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportFormat = (typeof REPORT_FORMATS)[number];
