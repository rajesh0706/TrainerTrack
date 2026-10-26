import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getOwnClient } from "@/features/clients/access";
import { ReportBuilder } from "@/features/reports/components/report-builder";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My reports" };

export default async function ClientReportsPage() {
  await requireRole("client");
  const client = await getOwnClient();
  if (!client) {
    return (
      <div>
        <PageHeader title="My reports" />
        <EmptyState
          title="Not linked"
          description="Your trainer needs to invite this email to the portal."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reports"
        description="Download your own attendance and progress files. Studio-wide reports stay with your trainer."
      />
      <ReportBuilder
        trainerView={false}
        lockedClientId={client.id}
        clients={[
          {
            id: client.id,
            full_name: client.full_name,
            status: client.status,
          },
        ]}
      />
    </div>
  );
}
