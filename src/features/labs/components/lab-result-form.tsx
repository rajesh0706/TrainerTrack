"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/features/attendance/dates";
import {
  createLabResultAction,
  updateLabResultAction,
} from "@/features/labs/actions";
import { LAB_FIELDS } from "@/features/labs/fields";
import {
  labResultFormSchema,
  type LabResultFormInput,
} from "@/features/labs/schemas";
import type { LabResult } from "@/lib/supabase/database.types";

function defaults(clientId: string, result?: LabResult): LabResultFormInput {
  return {
    client_id: result?.client_id ?? clientId,
    tested_on: result?.tested_on ?? isoDate(new Date()),
    b12: result?.b12 ?? "",
    vitamin_d: result?.vitamin_d ?? "",
    hemogram: result?.hemogram ?? "",
    hemoglobin: result?.hemoglobin ?? "",
    homocysteine: result?.homocysteine ?? "",
    c_reactive_protein: result?.c_reactive_protein ?? "",
    serum_creatinine: result?.serum_creatinine ?? "",
    serum_ferritin: result?.serum_ferritin ?? "",
    urea: result?.urea ?? "",
    uric_acid: result?.uric_acid ?? "",
    calcium: result?.calcium ?? "",
    electrolytes: result?.electrolytes ?? "",
    lipids: result?.lipids ?? "",
    fasting_sugar: result?.fasting_sugar ?? "",
    t3_t4_tsh: result?.t3_t4_tsh ?? "",
    notes: result?.notes ?? "",
  };
}

export function LabResultForm({
  clientId,
  result,
  disabled,
  onSuccess,
}: {
  clientId: string;
  result?: LabResult;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<LabResultFormInput>({
    resolver: zodResolver(labResultFormSchema),
    defaultValues: defaults(clientId, result),
  });

  function onSubmit(values: LabResultFormInput) {
    startTransition(async () => {
      const outcome = result
        ? await updateLabResultAction(result.id, values)
        : await createLabResultAction(values);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      toast.success(result ? "Test results updated" : "Test results saved");
      if (!result) form.reset(defaults(clientId));
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <input type="hidden" {...form.register("client_id")} />
        <FormField
          control={form.control}
          name="tested_on"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Input {...field} type="date" disabled={disabled} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {LAB_FIELDS.map((lab) => (
            <FormField
              key={lab.key}
              control={form.control}
              name={lab.key}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lab.label}</FormLabel>
                  <Input
                    {...field}
                    value={typeof field.value === "string" ? field.value : field.value ?? ""}
                    disabled={disabled}
                    placeholder="Value or panel notes"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <Textarea
                {...field}
                value={typeof field.value === "string" ? field.value : field.value ?? ""}
                rows={3}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || disabled}>
            {pending ? "Saving…" : result ? "Save changes" : "Add test results"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
