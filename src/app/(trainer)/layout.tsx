import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function TrainerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole("trainer");

  return <AppShell user={user}>{children}</AppShell>;
}
