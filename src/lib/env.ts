import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const PLACEHOLDER_KEYS = new Set(["your_anon_key", "your_service_role_key"]);

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function hasPublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublishableKey(),
  );
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = getSupabasePublishableKey();
  return (
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    !url.includes("YOUR_PROJECT") &&
    key.length > 20 &&
    !PLACEHOLDER_KEYS.has(key)
  );
}

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getSupabasePublishableKey(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    throw new Error(
      "Missing public Supabase environment variables. Copy .env.example to .env.local.",
    );
  }

  return parsed.data;
}

export function getServerEnv() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getSupabasePublishableKey(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      !serviceRole || PLACEHOLDER_KEYS.has(serviceRole) ? undefined : serviceRole,
  });

  if (!parsed.success) {
    throw new Error(
      "Missing server environment variables. Copy .env.example to .env.local.",
    );
  }

  return parsed.data;
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
