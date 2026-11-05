import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConsentNotice } from "@/features/progress/components/consent-notice";
import { MeasurementForm } from "@/features/progress/components/measurement-form";
import { MeasurementTable } from "@/features/progress/components/measurement-table";
import { ProgressCharts } from "@/features/progress/components/progress-charts";
import { listMeasurements } from "@/features/progress/queries";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Progress" };

export default async function ClientProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  const measurements = await listMeasurements(client.id);
  const consented = client.consent_health_data;

  return (
    <div className="space-y-6">
      {!consented ? <ConsentNotice clientId={client.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Add measurement</CardTitle>
          <CardDescription>
            Weight, body fat, and girths. Enter at least one number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm clientId={client.id} />
        </CardContent>
      </Card>
      <ProgressCharts measurements={measurements} />
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Newest entries first. Edit or delete any row.</CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementTable clientId={client.id} measurements={measurements} />
        </CardContent>
      </Card>
    </div>
  );
}
