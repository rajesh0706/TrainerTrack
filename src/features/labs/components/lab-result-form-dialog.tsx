"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LabResultForm } from "@/features/labs/components/lab-result-form";
import type { LabResult } from "@/lib/supabase/database.types";

export function LabResultFormDialog({
  open,
  onOpenChange,
  clientId,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  result?: LabResult;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit test results</DialogTitle>
          <DialogDescription>Update the labs recorded for this date.</DialogDescription>
        </DialogHeader>
        <LabResultForm
          clientId={clientId}
          result={result}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
