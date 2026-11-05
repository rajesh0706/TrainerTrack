import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrainerClient } from "@/features/clients/queries";
import { LabResultForm } from "@/features/labs/components/lab-result-form";
import { LabResultList } from "@/features/labs/components/lab-result-list";
import { listLabResults } from "@/features/labs/queries";
import { ConsentNotice } from "@/features/progress/components/consent-notice";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Test results" };

export default async function ClientTestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  const results = await listLabResults(client.id);
  const consented = client.consent_health_data;

  return (
    <div className="space-y-6">
      {!consented ? <ConsentNotice clientId={client.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Add test results</CardTitle>
          <CardDescription>
            Record blood work by date. Leave unused labs blank. Include units in
            the value if you want them (for example 42 ng/mL).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LabResultForm clientId={client.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Newest lab visits first.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabResultList clientId={client.id} results={results} />
        </CardContent>
      </Card>
    </div>
  );
}
