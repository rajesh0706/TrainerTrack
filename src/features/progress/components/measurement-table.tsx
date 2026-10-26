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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteMeasurementAction } from "@/features/progress/actions";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import { formatCm, formatDate, formatKg, formatPercent } from "@/lib/format";
import type { Measurement } from "@/lib/supabase/database.types";

export function MeasurementTable({
  clientId,
  measurements,
  readOnly,
}: {
  clientId: string;
  measurements: Measurement[];
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [deleting, setDeleting] = useState<Measurement | null>(null);
  const [pending, startTransition] = useTransition();
  const rows = [...measurements].reverse();

  function remove() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteMeasurementAction(deleting.id, clientId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Measurement deleted");
      setDeleting(null);
    });
  }

  if (measurements.length === 0) {
    return (
      <EmptyState
        title="No measurements yet"
        description="Add a weigh-in or body measurement to start the charts."
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Body fat</TableHead>
              <TableHead>Chest</TableHead>
              <TableHead>Waist</TableHead>
              <TableHead>Hips</TableHead>
              <TableHead>Arm</TableHead>
              <TableHead>Thigh</TableHead>
              {readOnly ? null : (
                <TableHead className="w-28">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDate(row.measured_on)}</TableCell>
                <TableCell>{formatKg(row.weight_kg)}</TableCell>
                <TableCell>{formatPercent(row.body_fat_pct, 1)}</TableCell>
                <TableCell>{formatCm(row.chest_cm)}</TableCell>
                <TableCell>{formatCm(row.waist_cm)}</TableCell>
                <TableCell>{formatCm(row.hips_cm)}</TableCell>
                <TableCell>{formatCm(row.arm_cm)}</TableCell>
                <TableCell>{formatCm(row.thigh_cm)}</TableCell>
                {readOnly ? null : (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(row)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border p-4 text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-medium">{formatDate(row.measured_on)}</p>
              {readOnly ? null : (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(row)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Weight {formatKg(row.weight_kg)}</div>
              <div>Body fat {formatPercent(row.body_fat_pct, 1)}</div>
              <div>Chest {formatCm(row.chest_cm)}</div>
              <div>Waist {formatCm(row.waist_cm)}</div>
              <div>Hips {formatCm(row.hips_cm)}</div>
              <div>Arm {formatCm(row.arm_cm)}</div>
              <div>Thigh {formatCm(row.thigh_cm)}</div>
            </dl>
            {row.notes ? <p className="mt-2">{row.notes}</p> : null}
          </li>
        ))}
      </ul>
      <MeasurementFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        clientId={clientId}
        measurement={editing ?? undefined}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this measurement?</AlertDialogTitle>
            <AlertDialogDescription>
              Charts and reports will no longer include this entry.
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
