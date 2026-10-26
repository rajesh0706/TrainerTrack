import { z } from "zod";

export const PHOTO_LABELS = ["front", "side", "back", "other"] as const;

function metric(min: number, max: number, message: string) {
  return z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value == null) return null;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === null || (value >= min && value <= max), message);
}

export const measurementFormSchema = z
  .object({
    client_id: z.string().uuid(),
    measured_on: z.string().min(1, "Choose a date"),
    weight_kg: metric(20, 400, "Weight must be between 20 and 400 kg"),
    body_fat_pct: metric(1, 75, "Body fat must be between 1 and 75%"),
    chest_cm: metric(20, 250, "Chest must be between 20 and 250 cm"),
    waist_cm: metric(20, 250, "Waist must be between 20 and 250 cm"),
    hips_cm: metric(20, 250, "Hips must be between 20 and 250 cm"),
    arm_cm: metric(10, 80, "Arm must be between 10 and 80 cm"),
    thigh_cm: metric(20, 120, "Thigh must be between 20 and 120 cm"),
    notes: z
      .string()
      .trim()
      .transform((value) => (value.length === 0 ? null : value))
      .pipe(z.string().max(2000).nullable()),
  })
  .refine(
    (value) =>
      [
        value.weight_kg,
        value.body_fat_pct,
        value.chest_cm,
        value.waist_cm,
        value.hips_cm,
        value.arm_cm,
        value.thigh_cm,
      ].some((metricValue) => metricValue != null),
    { message: "Enter at least one measurement", path: ["weight_kg"] },
  );

export const photoMetaSchema = z.object({
  client_id: z.string().uuid(),
  taken_on: z.string().min(1, "Choose a date"),
  storage_path: z.string().min(1),
  label: z.enum(PHOTO_LABELS),
});

export type MeasurementFormInput = z.input<typeof measurementFormSchema>;
export type PhotoMetaInput = z.infer<typeof photoMetaSchema>;
