"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MeasurementForm } from "@/features/progress/components/measurement-form";
import type { Measurement } from "@/lib/supabase/database.types";

export function MeasurementFormDialog({
  open,
  onOpenChange,
  clientId,
  measurement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  measurement?: Measurement;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit measurement</DialogTitle>
          <DialogDescription>Update the numbers for this date.</DialogDescription>
        </DialogHeader>
        <MeasurementForm
          clientId={clientId}
          measurement={measurement}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
