import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SessionHistory } from "@/features/attendance/components/session-history";
import { isoDate } from "@/features/attendance/dates";
import { listSessionsInRange } from "@/features/attendance/queries";
import { getOwnClient } from "@/features/clients/access";
import { requireRole } from "@/lib/auth/session";
import { subMonths } from "date-fns";

export const metadata: Metadata = { title: "My attendance" };

export default async function ClientAttendancePage() {
  await requireRole("client");
  const client = await getOwnClient();
  if (!client) {
    return (
      <div>
        <PageHeader title="My attendance" />
        <EmptyState
          title="Not linked"
          description="Your trainer needs to invite this email to the portal."
        />
      </div>
    );
  }

  const sessions = await listSessionsInRange(
    client.trainer_id,
    isoDate(subMonths(new Date(), 6)),
    isoDate(new Date()),
    client.id,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My attendance"
        description="Read-only history for the last six months."
      />
      <SessionHistory sessions={[...sessions].reverse()} />
    </div>
  );
}
