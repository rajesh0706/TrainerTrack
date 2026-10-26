"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  bulkSetSessionStatusAction,
  deleteSessionAction,
} from "@/features/attendance/actions";
import { AddSessionButton } from "@/features/attendance/components/add-session-button";
import { QuickMarkButtons } from "@/features/attendance/components/quick-mark-buttons";
import { SessionFormDialog } from "@/features/attendance/components/session-form-dialog";
import { SessionStatusBadge } from "@/features/attendance/components/session-status-badge";
import {
  SESSION_STATUS_LABELS,
  SESSION_TYPE_LABELS,
} from "@/features/attendance/labels";
import type { ClientOption, SessionWithClient } from "@/features/attendance/types";
import { SESSION_STATUSES } from "@/features/attendance/schemas";
import { formatDate, formatTime } from "@/lib/format";
import type { Session, SessionStatus } from "@/lib/supabase/database.types";

export function SessionList({
  sessions,
  clients,
  showClient,
  lockedClientId,
  emptyTitle,
  emptyDescription,
}: {
  sessions: SessionWithClient[];
  clients: ClientOption[];
  showClient?: boolean;
  lockedClientId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [pending, startTransition] = useTransition();

  const allIds = sessions.map((session) => session.id);
  const allSelected = allIds.length > 0 && selected.length === allIds.length;

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  function bulkMark(status: SessionStatus) {
    startTransition(async () => {
      const result = await bulkSetSessionStatusAction(selected, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Updated ${result.updated} sessions`);
      setSelected([]);
    });
  }

  function remove() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteSessionAction(deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Session deleted");
      setDeleting(null);
    });
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "No sessions yet"}
        description={emptyDescription ?? "Add a session to start tracking attendance."}
      >
        <AddSessionButton clients={clients} lockedClientId={lockedClientId} />
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) =>
              setSelected(checked === true ? allIds : [])
            }
            aria-label="Select all sessions"
          />
          Select all
        </label>
        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-sm text-muted-foreground">
              {selected.length} selected
            </span>
            {SESSION_STATUSES.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => bulkMark(status)}
              >
                {SESSION_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <ul className="grid gap-3">
        {sessions.map((session) => (
          <li key={session.id} className="rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                className="mt-1"
                checked={selected.includes(session.id)}
                onCheckedChange={(checked) => toggle(session.id, checked === true)}
                aria-label={`Select session at ${formatTime(session.start_time)}`}
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {showClient ? (
                      <Link
                        href={`/clients/${session.client_id}/attendance`}
                        className="font-medium hover:underline"
                      >
                        {session.client_name}
                      </Link>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(session.session_date, "EEE d MMM")} ·{" "}
                      {formatTime(session.start_time)} · {session.duration_min} min ·{" "}
                      {SESSION_TYPE_LABELS[session.type]}
                    </p>
                    {session.notes ? (
                      <p className="mt-1 text-sm">{session.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <SessionStatusBadge status={session.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Session actions"
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(session)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(session)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <QuickMarkButtons sessionId={session.id} current={session.status} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <SessionFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        session={editing ?? undefined}
        clients={clients}
        lockedClientId={lockedClientId ?? editing?.client_id}
        title="Edit session"
        description="Update time, type, or attendance status."
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the attendance record. You can add it again later.
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
    </div>
  );
}
