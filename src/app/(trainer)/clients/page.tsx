import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { AddClientButton } from "@/features/clients/components/add-client-button";
import { ClientsFilters } from "@/features/clients/components/clients-filters";
import { ClientsPagination } from "@/features/clients/components/clients-pagination";
import { ClientsTable } from "@/features/clients/components/clients-table";
import {
  listTrainerClients,
  parseClientListQuery,
} from "@/features/clients/queries";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("trainer");
  const query = parseClientListQuery(await searchParams);
  const { clients, total, page, pageCount } = await listTrainerClients(
    user.id,
    query,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0 space-y-1"
          title="Clients"
          description="Search, filter, and keep client records up to date."
        />
        <AddClientButton />
      </div>
      <ClientsFilters query={query} />
      <ClientsTable clients={clients} query={query} />
      <ClientsPagination
        query={query}
        page={page}
        pageCount={pageCount}
        total={total}
      />
    </div>
  );
}
