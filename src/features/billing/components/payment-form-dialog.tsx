"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "@/features/billing/components/payment-form";
import type { BillingPlan, Payment } from "@/lib/supabase/database.types";

export function PaymentFormDialog({
  open,
  onOpenChange,
  clientId,
  plan,
  payment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  plan: BillingPlan;
  payment?: Payment;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit payment</DialogTitle>
          <DialogDescription>
            Change the date, amount, or method. The covered period stays the same.
          </DialogDescription>
        </DialogHeader>
        <PaymentForm
          clientId={clientId}
          plan={plan}
          payment={payment}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
