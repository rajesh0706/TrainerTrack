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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createSessionAction,
  updateSessionAction,
} from "@/features/attendance/actions";
import {
  SESSION_STATUS_LABELS,
  SESSION_TYPE_LABELS,
} from "@/features/attendance/labels";
import {
  SESSION_STATUSES,
  SESSION_TYPES,
  sessionFormSchema,
  type SessionFormInput,
} from "@/features/attendance/schemas";
import type { ClientOption } from "@/features/attendance/types";
import { isoDate } from "@/features/attendance/dates";
import { formatTime } from "@/lib/format";
import type { Session } from "@/lib/supabase/database.types";

function defaults(
  session?: Session,
  options?: { clientId?: string; date?: string },
): SessionFormInput {
  return {
    client_id: session?.client_id ?? options?.clientId ?? "",
    session_date: session?.session_date ?? options?.date ?? isoDate(new Date()),
    start_time: session ? formatTime(session.start_time) : "09:00",
    duration_min: session?.duration_min ?? 60,
    type: session?.type ?? "personal",
    status: session?.status ?? "attended",
    notes: session?.notes ?? "",
  };
}

export function SessionForm({
  session,
  clients,
  lockedClientId,
  defaultDate,
  onSuccess,
}: {
  session?: Session;
  clients: ClientOption[];
  lockedClientId?: string;
  defaultDate?: string;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: defaults(session, {
      clientId: lockedClientId,
      date: defaultDate,
    }),
  });

  function onSubmit(values: SessionFormInput) {
    startTransition(async () => {
      const result = session
        ? await updateSessionAction(session.id, values)
        : await createSessionAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(session ? "Session updated" : "Session added");
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {lockedClientId ? (
          <input type="hidden" {...form.register("client_id")} />
        ) : (
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="session_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Input {...field} type="date" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time</FormLabel>
                <Input {...field} type="time" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (min)</FormLabel>
                <Input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={typeof field.value === "number" ? field.value : Number(field.value) || ""}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Session type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SESSION_TYPE_LABELS[type]}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {SESSION_STATUS_LABELS[status]}
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
              <Textarea {...field} value={field.value ?? ""} rows={2} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : session ? "Save session" : "Add session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
