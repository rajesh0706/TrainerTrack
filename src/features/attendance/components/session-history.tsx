import { EmptyState } from "@/components/empty-state";
import { SessionStatusBadge } from "@/features/attendance/components/session-status-badge";
import { SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import type { SessionWithClient } from "@/features/attendance/types";
import { formatDate, formatTime } from "@/lib/format";

export function SessionHistory({ sessions }: { sessions: SessionWithClient[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        description="When your trainer logs sessions, they will show up here."
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {sessions.map((session) => (
        <li key={session.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{formatDate(session.session_date, "EEEE d MMM yyyy")}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(session.start_time)} · {session.duration_min} min ·{" "}
                {SESSION_TYPE_LABELS[session.type]}
              </p>
              {session.notes ? <p className="mt-1 text-sm">{session.notes}</p> : null}
            </div>
            <SessionStatusBadge status={session.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
