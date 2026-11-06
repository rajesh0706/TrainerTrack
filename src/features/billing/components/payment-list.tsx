"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
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
import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "@/features/billing/actions";
import { PaymentFormDialog } from "@/features/billing/components/payment-form-dialog";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { BillingPlan, Payment } from "@/lib/supabase/database.types";

export function PaymentList({
  clientId,
  plan,
  payments,
}: {
  clientId: string;
  plan: BillingPlan;
  payments: Payment[];
}) {
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!deleting) return;
    startTransition(async () => {
      const outcome = await deletePaymentAction(deleting.id, clientId);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      toast.success("Payment deleted");
      setDeleting(null);
    });
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="Record a payment to mark this cycle as paid and move the next due date forward."
      />
    );
  }

  return (
    <>
      <ul className="grid gap-3">
        {payments.map((payment) => (
          <li key={payment.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {formatMoney(payment.amount, payment.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Paid {formatDate(payment.paid_on)} ·{" "}
                  {PAYMENT_METHOD_LABELS[payment.method]} · covers{" "}
                  {formatDate(payment.period_start)} – {formatDate(payment.period_end)}
                </p>
                {payment.notes ? (
                  <p className="mt-2 text-sm">{payment.notes}</p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(payment)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleting(payment)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <PaymentFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        clientId={clientId}
        plan={plan}
        payment={editing ?? undefined}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              If this was the latest recorded cycle, the next due date will move
              back to the start of that period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
