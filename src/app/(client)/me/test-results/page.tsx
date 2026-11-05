import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getOwnClient } from "@/features/clients/access";
import { LabResultList } from "@/features/labs/components/lab-result-list";
import { listLabResults } from "@/features/labs/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My test results" };

export default async function ClientOwnTestResultsPage() {
  await requireRole("client");
  const client = await getOwnClient();
  if (!client) {
    return (
      <div>
        <PageHeader title="My test results" />
        <EmptyState
          title="Not linked"
          description="Your trainer needs to invite this email to the portal."
        />
      </div>
    );
  }

  const results = await listLabResults(client.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My test results"
        description="Blood work your trainer recorded. Editing is trainer-only."
      />
      <LabResultList clientId={client.id} results={results} readOnly />
    </div>
  );
}
