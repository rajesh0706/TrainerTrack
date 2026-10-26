import { Badge } from "@/components/ui/badge";
import { SESSION_STATUS_LABELS } from "@/features/attendance/labels";
import type { SessionStatus } from "@/lib/supabase/database.types";

const variants: Record<SessionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  attended: "default",
  late: "secondary",
  missed: "destructive",
  cancelled: "outline",
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return <Badge variant={variants[status]}>{SESSION_STATUS_LABELS[status]}</Badge>;
}
