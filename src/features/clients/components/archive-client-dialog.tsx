"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setClientStatusAction } from "@/features/clients/actions";
import type { Client } from "@/lib/supabase/database.types";

export function ArchiveClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const archived = client.status === "archived";

  function confirm() {
    startTransition(async () => {
      const result = await setClientStatusAction(
        client.id,
        archived ? "active" : "archived",
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(archived ? "Client restored" : "Client archived");
      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {archived ? "Restore client?" : "Archive client?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archived
              ? `${client.full_name} will show as active again.`
              : `${client.full_name} will be hidden from the default list. Attendance and progress stay on file.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending}>
            {pending ? "Saving…" : archived ? "Restore" : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
