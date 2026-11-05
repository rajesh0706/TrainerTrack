import { z } from "zod";

import { LAB_FIELDS } from "@/features/labs/fields";

const optionalLabText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.string().max(500).nullable());

export const labResultFormSchema = z
  .object({
    client_id: z.string().uuid(),
    tested_on: z.string().min(1, "Choose a date"),
    b12: optionalLabText,
    vitamin_d: optionalLabText,
    hemogram: optionalLabText,
    hemoglobin: optionalLabText,
    homocysteine: optionalLabText,
    c_reactive_protein: optionalLabText,
    serum_creatinine: optionalLabText,
    serum_ferritin: optionalLabText,
    urea: optionalLabText,
    uric_acid: optionalLabText,
    calcium: optionalLabText,
    electrolytes: optionalLabText,
    lipids: optionalLabText,
    fasting_sugar: optionalLabText,
    t3_t4_tsh: optionalLabText,
    notes: z
      .string()
      .trim()
      .transform((value) => (value.length === 0 ? null : value))
      .pipe(z.string().max(2000).nullable()),
  })
  .refine(
    (value) =>
      Boolean(value.notes) ||
      LAB_FIELDS.some((field) => value[field.key] != null),
    {
      message: "Enter at least one test result or a note",
      path: ["b12"],
    },
  );

export type LabResultFormInput = z.input<typeof labResultFormSchema>;
export type LabResultFormValues = z.infer<typeof labResultFormSchema>;
