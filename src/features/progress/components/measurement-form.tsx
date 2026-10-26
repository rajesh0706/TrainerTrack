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
import {
  createMeasurementAction,
  updateMeasurementAction,
} from "@/features/progress/actions";
import { isoDate } from "@/features/attendance/dates";
import {
  measurementFormSchema,
  type MeasurementFormInput,
} from "@/features/progress/schemas";
import type { Measurement } from "@/lib/supabase/database.types";

function emptyToNull(value: number | null | undefined) {
  return value ?? "";
}

function defaults(clientId: string, measurement?: Measurement): MeasurementFormInput {
  return {
    client_id: measurement?.client_id ?? clientId,
    measured_on: measurement?.measured_on ?? isoDate(new Date()),
    weight_kg: emptyToNull(measurement?.weight_kg),
    body_fat_pct: emptyToNull(measurement?.body_fat_pct),
    chest_cm: emptyToNull(measurement?.chest_cm),
    waist_cm: emptyToNull(measurement?.waist_cm),
    hips_cm: emptyToNull(measurement?.hips_cm),
    arm_cm: emptyToNull(measurement?.arm_cm),
    thigh_cm: emptyToNull(measurement?.thigh_cm),
    notes: measurement?.notes ?? "",
  };
}

export function MeasurementForm({
  clientId,
  measurement,
  disabled,
  onSuccess,
}: {
  clientId: string;
  measurement?: Measurement;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<MeasurementFormInput>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: defaults(clientId, measurement),
  });

  function onSubmit(values: MeasurementFormInput) {
    startTransition(async () => {
      const result = measurement
        ? await updateMeasurementAction(measurement.id, values)
        : await createMeasurementAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(measurement ? "Measurement updated" : "Measurement saved");
      if (!measurement) form.reset(defaults(clientId));
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <input type="hidden" {...form.register("client_id")} />
        <FormField
          control={form.control}
          name="measured_on"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Input {...field} type="date" disabled={disabled} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField form={form} name="weight_kg" label="Weight (kg)" step="0.1" disabled={disabled} />
          <NumberField form={form} name="body_fat_pct" label="Body fat %" step="0.1" disabled={disabled} />
          <NumberField form={form} name="chest_cm" label="Chest (cm)" step="0.1" disabled={disabled} />
          <NumberField form={form} name="waist_cm" label="Waist (cm)" step="0.1" disabled={disabled} />
          <NumberField form={form} name="hips_cm" label="Hips (cm)" step="0.1" disabled={disabled} />
          <NumberField form={form} name="arm_cm" label="Arm (cm)" step="0.1" disabled={disabled} />
          <NumberField form={form} name="thigh_cm" label="Thigh (cm)" step="0.1" disabled={disabled} />
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
                rows={2}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || disabled}>
            {pending ? "Saving…" : measurement ? "Save changes" : "Add measurement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function NumberField({
  form,
  name,
  label,
  step,
  disabled,
}: {
  form: ReturnType<typeof useForm<MeasurementFormInput>>;
  name:
    | "weight_kg"
    | "body_fat_pct"
    | "chest_cm"
    | "waist_cm"
    | "hips_cm"
    | "arm_cm"
    | "thigh_cm";
  label: string;
  step: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Input
            type="number"
            inputMode="decimal"
            step={step}
            disabled={disabled}
            value={field.value == null ? "" : String(field.value)}
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
