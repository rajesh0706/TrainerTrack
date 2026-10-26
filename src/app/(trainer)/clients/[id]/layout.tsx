import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { ClientTabs } from "@/features/clients/components/client-tabs";
import { StatusBadge } from "@/features/clients/components/status-badge";
import { getTrainerClient } from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export default async function ClientDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("trainer");
  const { id } = await params;
  const client = await getTrainerClient(user.id, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/clients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          Clients
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {client.full_name}
          </h1>
          <StatusBadge status={client.status} />
        </div>
        <p className="text-sm text-muted-foreground">{client.email}</p>
      </div>
      <ClientTabs clientId={client.id} />
      {children}
    </div>
  );
}
