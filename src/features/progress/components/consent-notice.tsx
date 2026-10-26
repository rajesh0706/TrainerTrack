import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConsentNotice({ clientId }: { clientId: string }) {
  return (
    <Alert>
      <AlertTitle>Consent required</AlertTitle>
      <AlertDescription>
        This client has not agreed to storing measurements or progress photos.
        Open the{" "}
        <Link href={`/clients/${clientId}`} className="underline underline-offset-4">
          Overview
        </Link>{" "}
        tab, edit the client, and tick the health-data consent box first.
      </AlertDescription>
    </Alert>
  );
}
