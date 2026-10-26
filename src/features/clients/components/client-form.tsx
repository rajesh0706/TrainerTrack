"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createClientAction,
  updateClientAction,
} from "@/features/clients/actions";
import { GENDER_LABELS, STATUS_LABELS } from "@/features/clients/labels";
import {
  CLIENT_STATUSES,
  GENDERS,
  clientFormSchema,
  type ClientFormInput,
} from "@/features/clients/schemas";
import type { Client } from "@/lib/supabase/database.types";

function toFormValues(client?: Client): ClientFormInput {
  return {
    full_name: client?.full_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    date_of_birth: client?.date_of_birth ?? "",
    gender: client?.gender ?? "",
    height_cm: client?.height_cm ?? null,
    goal: client?.goal ?? "",
    start_date: client?.start_date ?? new Date().toISOString().slice(0, 10),
    status: client?.status ?? "active",
    notes: client?.notes ?? "",
    consent_health_data: client?.consent_health_data ?? false,
  };
}

export function ClientForm({
  client,
  onSuccess,
}: {
  client?: Client;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: toFormValues(client),
  });

  function onSubmit(values: ClientFormInput) {
    startTransition(async () => {
      const result = client
        ? await updateClientAction(client.id, values)
        : await createClientAction(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(client ? "Client updated" : "Client added");
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <Input {...field} autoComplete="name" aria-invalid={!!fieldState.error} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="tel"
                  autoComplete="tel"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_date"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <Input {...field} type="date" aria-invalid={!!fieldState.error} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="date"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={50}
                  max={250}
                  step="0.1"
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? null : event.target.value,
                    )
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger className="w-full" aria-label="Gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {GENDER_LABELS[gender]}
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
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
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
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <Input {...field} value={field.value ?? ""} placeholder="Build strength, lose fat…" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <Textarea {...field} value={field.value ?? ""} rows={3} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="consent_health_data"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-describedby="consent-help"
                />
                <div className="grid gap-1">
                  <FormLabel className="font-normal">
                    Client consents to storing measurements and progress photos
                  </FormLabel>
                  <FormDescription id="consent-help">
                    Health data is private and only visible to this trainer and
                    the client. You can withdraw consent later.
                  </FormDescription>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : client ? "Save changes" : "Add client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
