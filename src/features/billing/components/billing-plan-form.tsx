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
import { saveBillingPlanAction } from "@/features/billing/actions";
import {
  BILLING_CADENCE_LABELS,
  BILLING_PLAN_STATUS_LABELS,
} from "@/features/billing/labels";
import {
  BILLING_CADENCES,
  BILLING_CURRENCIES,
  BILLING_PLAN_STATUSES,
  billingPlanFormSchema,
  type BillingPlanFormInput,
} from "@/features/billing/schemas";
import type { BillingPlan } from "@/lib/supabase/database.types";

function defaults(clientId: string, plan?: BillingPlan | null): BillingPlanFormInput {
  const today = isoDate(new Date());
  return {
    client_id: plan?.client_id ?? clientId,
    amount: plan?.amount ?? 0,
    currency:
      plan && (BILLING_CURRENCIES as readonly string[]).includes(plan.currency)
        ? (plan.currency as (typeof BILLING_CURRENCIES)[number])
        : "INR",
    cadence: plan?.cadence ?? "monthly",
    starts_on: plan?.starts_on ?? today,
    next_due_on: plan?.next_due_on ?? plan?.starts_on ?? today,
    status: plan?.status ?? "active",
    notes: plan?.notes ?? "",
  };
}

export function BillingPlanForm({
  clientId,
  plan,
}: {
  clientId: string;
  plan?: BillingPlan | null;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<BillingPlanFormInput>({
    resolver: zodResolver(billingPlanFormSchema),
    defaultValues: defaults(clientId, plan),
  });

  function onSubmit(values: BillingPlanFormInput) {
    startTransition(async () => {
      const outcome = await saveBillingPlanAction(values);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      toast.success(plan ? "Billing plan updated" : "Billing plan saved");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cadence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cadence</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Cadence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CADENCES.map((cadence) => (
                      <SelectItem key={cadence} value={cadence}>
                        {BILLING_CADENCE_LABELS[cadence]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Plan status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_PLAN_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {BILLING_PLAN_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="starts_on"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan start</FormLabel>
                <Input type="date" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="next_due_on"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next due</FormLabel>
                <Input type="date" {...field} />
                <FormDescription>
                  Recording a payment moves this forward by one cycle.
                </FormDescription>
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
                rows={3}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : plan ? "Update plan" : "Save plan"}
        </Button>
      </form>
    </Form>
  );
}
