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
import { deleteLabResultAction } from "@/features/labs/actions";
import { LabResultFormDialog } from "@/features/labs/components/lab-result-form-dialog";
import { LAB_FIELDS } from "@/features/labs/fields";
import { formatDate } from "@/lib/format";
import type { LabResult } from "@/lib/supabase/database.types";

export function LabResultList({
  clientId,
  results,
  readOnly,
}: {
  clientId: string;
  results: LabResult[];
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<LabResult | null>(null);
  const [deleting, setDeleting] = useState<LabResult | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!deleting) return;
    startTransition(async () => {
      const outcome = await deleteLabResultAction(deleting.id, clientId);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      toast.success("Test results deleted");
      setDeleting(null);
    });
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title="No test results yet"
        description="Add a blood-work entry with a date and at least one lab value."
      />
    );
  }

  return (
    <>
      <ul className="grid gap-3">
        {results.map((row) => {
          const filled = LAB_FIELDS.filter((field) => row[field.key]);
          return (
            <li key={row.id} className="rounded-xl border p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{formatDate(row.tested_on)}</p>
                {readOnly ? null : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleting(row)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              {filled.length > 0 ? (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {filled.map((field) => (
                    <div key={field.key} className="text-sm">
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd>{row[field.key]}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {row.notes ? <p className="mt-3 text-sm">{row.notes}</p> : null}
            </li>
          );
        })}
      </ul>
      <LabResultFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        clientId={clientId}
        result={editing ?? undefined}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete these test results?</AlertDialogTitle>
            <AlertDialogDescription>
              This blood-work entry will be removed permanently.
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
