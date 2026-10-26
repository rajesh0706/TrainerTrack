import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/database.types";

const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];
const TRAINER_PREFIXES = [
  "/dashboard",
  "/clients",
  "/attendance",
  "/reports",
  "/settings",
];
const CLIENT_PREFIXES = ["/me"];

function isPrefixed(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = isPrefixed(pathname, AUTH_ROUTES);
  const isTrainerRoute = isPrefixed(pathname, TRAINER_PREFIXES);
  const isClientRoute = isPrefixed(pathname, CLIENT_PREFIXES);
  const isProtected = isTrainerRoute || isClientRoute;

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "client";

  if (isAuthRoute && pathname !== "/reset-password" && profile) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "trainer" ? "/dashboard" : "/me";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isTrainerRoute && role !== "trainer") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/me";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isClientRoute && role !== "client") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
