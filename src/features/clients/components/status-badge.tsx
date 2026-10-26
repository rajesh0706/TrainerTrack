import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/features/clients/labels";
import type { ClientStatus } from "@/lib/supabase/database.types";

const variants: Record<
  ClientStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  paused: "secondary",
  archived: "outline",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return <Badge variant={variants[status]}>{STATUS_LABELS[status]}</Badge>;
}
