import { z } from "zod";

export const CLIENT_STATUSES = ["active", "paused", "archived"] as const;
export const GENDERS = [
  "female",
  "male",
  "non-binary",
  "prefer_not_to_say",
  "other",
] as const;
export const CLIENT_SORT_FIELDS = [
  "full_name",
  "email",
  "start_date",
  "status",
  "created_at",
] as const;

export const clientStatusSchema = z.enum(CLIENT_STATUSES);
export const genderSchema = z.enum(GENDERS);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const optionalHeight = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => {
    if (value === "" || value == null) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine(
    (value) => value === null || (value > 50 && value <= 250),
    "Height must be between 50 and 250 cm",
  );

export const clientFormSchema = z.object({
  full_name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: optionalText.pipe(z.string().max(40).nullable()),
  date_of_birth: z
    .string()
    .transform((value) => (value.length === 0 ? null : value)),
  gender: z
    .string()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(genderSchema.nullable()),
  height_cm: optionalHeight,
  goal: optionalText.pipe(z.string().max(500).nullable()),
  start_date: z.string().min(1, "Choose a start date"),
  status: clientStatusSchema,
  notes: optionalText.pipe(z.string().max(5000).nullable()),
  consent_health_data: z.boolean(),
});

export const clientListQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  status: z
    .enum(["all", ...CLIENT_STATUSES])
    .optional()
    .default("active"),
  sort: z.enum(CLIENT_SORT_FIELDS).optional().default("full_name"),
  dir: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientListQuery = z.infer<typeof clientListQuerySchema>;
