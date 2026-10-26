"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { rateLimit, rateLimitRetryAfter } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/session";
import type { UserRole } from "@/lib/supabase/database.types";

type ActionResult = { error: string | null; success?: string };

const MISSING_ENV_ERROR =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

async function clientKey(prefix: string, email: string) {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  return `${prefix}:${ip}:${email.toLowerCase()}`;
}

export async function loginAction(
  input: unknown,
  next?: string | null,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login details" };
  }

  if (!isSupabaseConfigured()) {
    return { error: MISSING_ENV_ERROR };
  }

  const limit = rateLimit(await clientKey("login", parsed.data.email));
  if (!limit.success) {
    return {
      error: `Too many login attempts. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unable to complete sign in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "client") as UserRole;
  redirect(safeRedirectPath(next, role));
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  if (!isSupabaseConfigured()) {
    return { error: MISSING_ENV_ERROR };
  }

  const limit = rateLimit(
    await clientKey("forgot", parsed.data.email),
    5,
    15 * 60 * 1000,
  );
  if (!limit.success) {
    return {
      error: `Too many reset requests. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });

  if (error) {
    return { error: "Unable to send a reset email. Try again later." };
  }

  return {
    error: null,
    success: "If that email exists, we sent a reset link.",
  };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error:
        "Unable to update password. Open the link from your email and try again.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(homePathForRole((profile?.role ?? "client") as UserRole));
}
