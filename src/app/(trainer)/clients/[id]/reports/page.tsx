import type { Metadata } from "next";

import { ReportBuilder } from "@/features/reports/components/report-builder";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reports" };

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Downloads for {client.full_name} only. Studio-wide reports live under Reports
        in the main menu.
      </p>
      <ReportBuilder
        clients={[
          {
            id: client.id,
            full_name: client.full_name,
            status: client.status,
          },
        ]}
        lockedClientId={client.id}
      />
    </div>
  );
}
