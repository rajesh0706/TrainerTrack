import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnClient } from "@/features/clients/access";
import { GrantConsentButton } from "@/features/progress/components/grant-consent-button";
import { MeasurementForm } from "@/features/progress/components/measurement-form";
import { MeasurementTable } from "@/features/progress/components/measurement-table";
import { PhotoGallery } from "@/features/progress/components/photo-gallery";
import { PhotoUploadForm } from "@/features/progress/components/photo-upload-form";
import { ProgressCharts } from "@/features/progress/components/progress-charts";
import { listMeasurements, listProgressPhotos } from "@/features/progress/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My progress" };

export default async function ClientProgressPage() {
  await requireRole("client");
  const client = await getOwnClient();
  if (!client) {
    return (
      <div>
        <PageHeader title="My progress" />
        <EmptyState
          title="Not linked"
          description="Your trainer needs to invite this email to the portal."
        />
      </div>
    );
  }

  const [measurements, photos] = await Promise.all([
    listMeasurements(client.id),
    listProgressPhotos(client.id),
  ]);
  const consented = client.consent_health_data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My progress"
        description="You can add measurements and photos. Editing history is trainer-only."
      />
      {!consented ? (
        <Card>
          <CardHeader>
            <CardTitle>Consent</CardTitle>
            <CardDescription>
              Measurements and photos are health data. Confirm you want them stored
              before uploading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrantConsentButton />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Add a measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementForm clientId={client.id} disabled={!consented} />
        </CardContent>
      </Card>
      <ProgressCharts measurements={measurements} />
      <MeasurementTable clientId={client.id} measurements={measurements} readOnly />
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploadForm clientId={client.id} disabled={!consented} />
        </CardContent>
      </Card>
      <PhotoGallery clientId={client.id} photos={photos} readOnly />
    </div>
  );
}
