"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "@/features/clients/components/client-form";
import type { Client } from "@/lib/supabase/database.types";

export function ClientFormDialog({
  client,
  open,
  onOpenChange,
  title,
  description,
}: {
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        <ClientForm client={client} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
