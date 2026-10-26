"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { inviteClientAction } from "@/features/clients/invite-actions";

export function InviteClientButton({
  clientId,
  invited,
}: {
  clientId: string;
  invited: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (invited) {
    return (
      <p className="text-sm text-muted-foreground">Portal login is linked.</p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await inviteClientAction(clientId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(result.success ?? "Invite sent");
        })
      }
    >
      {pending ? "Sending…" : "Invite to portal"}
    </Button>
  );
}
