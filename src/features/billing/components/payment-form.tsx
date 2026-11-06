"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/features/attendance/dates";
import {
  recordPaymentAction,
  updatePaymentAction,
} from "@/features/billing/actions";
import { periodCoveredByPayment } from "@/features/billing/calculations";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/labels";
import {
  PAYMENT_METHODS,
  paymentFormSchema,
  type PaymentFormInput,
} from "@/features/billing/schemas";
import { formatDate, formatMoney } from "@/lib/format";
import type { BillingPlan, Payment } from "@/lib/supabase/database.types";

function defaults(clientId: string, plan: BillingPlan, payment?: Payment): PaymentFormInput {
  return {
    client_id: payment?.client_id ?? clientId,
    paid_on: payment?.paid_on ?? isoDate(new Date()),
    amount: payment?.amount ?? plan.amount,
    method: payment?.method ?? "cash",
    notes: payment?.notes ?? "",
  };
}

export function PaymentForm({
  clientId,
  plan,
  payment,
  onSuccess,
}: {
  clientId: string;
  plan: BillingPlan;
  payment?: Payment;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: defaults(clientId, plan, payment),
  });

  const period = payment
    ? { period_start: payment.period_start, period_end: payment.period_end }
    : periodCoveredByPayment(plan.next_due_on, plan.cadence);

  function onSubmit(values: PaymentFormInput) {
    startTransition(async () => {
      const outcome = payment
        ? await updatePaymentAction(payment.id, values)
        : await recordPaymentAction(values);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      toast.success(payment ? "Payment updated" : "Payment recorded");
      if (!payment) form.reset(defaults(clientId, plan));
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Covers {formatDate(period.period_start)} – {formatDate(period.period_end)}
          {payment
            ? null
            : ` · next due becomes ${formatDate(
                periodCoveredByPayment(plan.next_due_on, plan.cadence).next_due_on,
              )}`}
          . Plan amount {formatMoney(plan.amount, plan.currency)}.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="paid_on"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid on</FormLabel>
                <Input type="date" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={field.value == null || field.value === 0 ? "" : String(field.value)}
                  onChange={(event) => field.onChange(event.target.value)}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Payment method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <Textarea
                rows={2}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              <FormDescription>Optional — receipt number, UPI ref, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : payment ? "Update payment" : "Record payment"}
        </Button>
      </form>
    </Form>
  );
}
