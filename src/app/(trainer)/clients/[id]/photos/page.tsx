import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConsentNotice } from "@/features/progress/components/consent-notice";
import { PhotoGallery } from "@/features/progress/components/photo-gallery";
import { PhotoUploadForm } from "@/features/progress/components/photo-upload-form";
import { listProgressPhotos } from "@/features/progress/queries";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Photos" };

export default async function ClientPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);
  const photos = await listProgressPhotos(client.id);
  const consented = client.consent_health_data;

  return (
    <div className="space-y-6">
      {!consented ? <ConsentNotice clientId={client.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>
            Photos are stored in a private bucket and loaded with short-lived signed URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUploadForm clientId={client.id} disabled={!consented} />
        </CardContent>
      </Card>
      <PhotoGallery clientId={client.id} photos={photos} />
    </div>
  );
}
