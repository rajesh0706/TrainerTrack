import { NextResponse } from "next/server";

import { isoDate } from "@/features/attendance/dates";
import { sessionsToIcs } from "@/features/attendance/ics";
import { listSessionsInRange } from "@/features/attendance/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, rateLimitRetryAfter } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.profile.role !== "trainer") {
    return NextResponse.json({ error: "Trainers only" }, { status: 403 });
  }

  const limit = rateLimit(`calendar:${user.id}`, 20, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: `Too many calendar downloads. Try again in ${rateLimitRetryAfter(limit.resetAt)} seconds.`,
      },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fromDate = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : isoDate(new Date());
  const toDate = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : fromDate;

  const sessions = await listSessionsInRange(user.id, fromDate, toDate);
  const body = sessionsToIcs(sessions, `${user.profile.full_name} · TrainerTrack`);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trainertrack-schedule.ics"',
    },
  });
}
