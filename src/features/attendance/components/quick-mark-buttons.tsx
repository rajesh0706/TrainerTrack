"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setSessionStatusAction } from "@/features/attendance/actions";
import { SESSION_STATUS_LABELS } from "@/features/attendance/labels";
import { QUICK_STATUSES } from "@/features/attendance/schemas";
import type { SessionStatus } from "@/lib/supabase/database.types";

export function QuickMarkButtons({
  sessionId,
  current,
}: {
  sessionId: string;
  current: SessionStatus;
}) {
  const [pending, startTransition] = useTransition();

  function mark(status: SessionStatus) {
    startTransition(async () => {
      const result = await setSessionStatusAction(sessionId, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marked ${SESSION_STATUS_LABELS[status].toLowerCase()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Mark attendance">
      {QUICK_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={current === status ? "default" : "outline"}
          disabled={pending}
          onClick={() => mark(status)}
        >
          {SESSION_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
