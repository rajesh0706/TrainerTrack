import { redirect } from "next/navigation";

import { hasPublicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  profile: Profile;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasPublicEnv()) return null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email,
    profile,
  };
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

export async function requireRole(role: UserRole) {
  const current = await requireUser();
  if (current.profile.role !== role) {
    redirect(current.profile.role === "trainer" ? "/dashboard" : "/me");
  }
  return current;
}

export function homePathForRole(role: UserRole) {
  return role === "trainer" ? "/dashboard" : "/me";
}

export function safeRedirectPath(
  path: string | null | undefined,
  role: UserRole,
) {
  const fallback = homePathForRole(role);
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\")
  ) {
    return fallback;
  }

  if (role === "trainer") {
    if (path === "/me" || path.startsWith("/me/")) return fallback;
    return path;
  }

  if (path === "/me" || path.startsWith("/me/")) return path;
  return fallback;
}
