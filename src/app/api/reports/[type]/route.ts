import { NextResponse } from "next/server";

import { buildReport } from "@/features/reports/data";
import { serializeReport } from "@/features/reports/render";
import {
  REPORT_TYPES,
  reportQuerySchema,
  TRAINER_ONLY_REPORTS,
} from "@/features/reports/schemas";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, rateLimitRetryAfter } from "@/lib/rate-limit";

export const runtime = "nodejs";

function filenameHeader(name: string) {
  const safe = name.replace(/["\r\n]/g, "_");
  return `attachment; filename="${safe}"`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = rateLimit(`reports:${user.id}`, 20, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: `Too many report downloads. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitRetryAfter(limit.resetAt)) },
      },
    );
  }

  const { type } = await context.params;
  if (!REPORT_TYPES.includes(type as (typeof REPORT_TYPES)[number])) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 404 });
  }

  if (
    TRAINER_ONLY_REPORTS.includes(type as (typeof TRAINER_ONLY_REPORTS)[number]) &&
    user.profile.role !== "trainer"
  ) {
    return NextResponse.json({ error: "Trainers only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = reportQuerySchema.safeParse({
    type,
    format: url.searchParams.get("format"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    clientId: url.searchParams.get("clientId") ?? undefined,
    includePhotos: url.searchParams.get("includePhotos") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid report request" },
      { status: 400 },
    );
  }

  try {
    const report = await buildReport(user, parsed.data);
    const file = await serializeReport(report, parsed.data.format);
    const body =
      typeof file.body === "string" ? file.body : new Uint8Array(file.body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": filenameHeader(file.filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build report";
    const status = message === "Client not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
