import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ReportBuilder } from "@/features/reports/components/report-builder";
import { listReportClients } from "@/features/reports/data";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireRole("trainer");
  const clients = await listReportClients(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Download PDF, Excel, or CSV for a date range. Branding uses your trainer settings when a logo exists."
      />
      <ReportBuilder clients={clients} />
    </div>
  );
}
