import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.string().max(40).nullable()),
});

export const brandingSchema = z.object({
  business_name: z.string().trim().min(2).max(120),
  logo_path: z.string().nullable().optional(),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
