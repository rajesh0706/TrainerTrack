"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SessionFormDialog } from "@/features/attendance/components/session-form-dialog";
import type { ClientOption } from "@/features/attendance/types";

export function AddSessionButton({
  clients,
  lockedClientId,
  defaultDate,
}: {
  clients: ClientOption[];
  lockedClientId?: string;
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={clients.length === 0 && !lockedClientId}>
        <PlusIcon />
        Add session
      </Button>
      <SessionFormDialog
        open={open}
        onOpenChange={setOpen}
        clients={clients}
        lockedClientId={lockedClientId}
        defaultDate={defaultDate}
        title="Add session"
        description="Log a session and mark attendance in one step."
      />
    </>
  );
}
