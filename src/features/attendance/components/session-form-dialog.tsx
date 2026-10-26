"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionForm } from "@/features/attendance/components/session-form";
import type { ClientOption } from "@/features/attendance/types";
import type { Session } from "@/lib/supabase/database.types";

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  clients,
  lockedClientId,
  defaultDate,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session;
  clients: ClientOption[];
  lockedClientId?: string;
  defaultDate?: string;
  title: string;
  description: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SessionForm
          session={session}
          clients={clients}
          lockedClientId={lockedClientId}
          defaultDate={defaultDate}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
