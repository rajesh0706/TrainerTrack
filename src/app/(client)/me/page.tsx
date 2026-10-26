import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnClient } from "@/features/clients/access";
import { listSessionsInRange } from "@/features/attendance/queries";
import { getClientOverviewStats } from "@/features/clients/queries";
import { SessionHistory } from "@/features/attendance/components/session-history";
import { isoDate } from "@/features/attendance/dates";
import { formatKg, formatPercent, signedNumber } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { subDays } from "date-fns";

export const metadata: Metadata = { title: "My dashboard" };

export default async function ClientHomePage() {
  const user = await requireRole("client");
  const client = await getOwnClient();

  if (!client) {
    return (
      <div>
        <PageHeader title={`Hi, ${user.profile.full_name}`} />
        <EmptyState
          title="This login is not linked yet"
          description="Ask your trainer to send a portal invite to the email on your client record."
        />
      </div>
    );
  }

  const stats = await getClientOverviewStats(client.id);
  const recent = await listSessionsInRange(
    client.trainer_id,
    isoDate(subDays(new Date(), 30)),
    isoDate(new Date()),
    client.id,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${client.full_name}`}
        description="Your sessions and progress. Only you and your trainer can see this."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Attendance</CardDescription>
            <CardTitle className="text-2xl">{formatPercent(stats.attendance.rate)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Sessions</CardDescription>
            <CardTitle className="text-2xl">{stats.attendance.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Weight change</CardDescription>
            <CardTitle className="text-2xl">
              {stats.weight ? `${signedNumber(stats.weight.change)} kg` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.weight ? formatKg(stats.weight.current) : "Log a measurement to start"}
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/me/progress" className="underline-offset-4 hover:underline">
          Log progress
        </Link>
        <Link href="/me/attendance" className="underline-offset-4 hover:underline">
          View attendance
        </Link>
        <Link href="/me/reports" className="underline-offset-4 hover:underline">
          Download reports
        </Link>
        <a href="/api/export" className="underline-offset-4 hover:underline">
          Download my data (JSON)
        </a>
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
      </div>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Last 30 days</h2>
        <SessionHistory sessions={recent.slice(-8).reverse()} />
      </section>
    </div>
  );
}
