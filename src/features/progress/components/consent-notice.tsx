import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConsentNotice({ clientId }: { clientId: string }) {
  return (
    <Alert>
      <AlertTitle>Health-data consent is not recorded yet</AlertTitle>
      <AlertDescription>
        You can still add measurements, photos, and blood work. To record consent
        on the client file, open{" "}
        <Link href={`/clients/${clientId}`} className="underline underline-offset-4">
          Overview
        </Link>
        , edit the client, and tick the health-data box.
      </AlertDescription>
    </Alert>
  );
}
