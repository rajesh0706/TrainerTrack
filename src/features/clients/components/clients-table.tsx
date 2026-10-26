import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientRowActions } from "@/features/clients/components/client-row-actions";
import { StatusBadge } from "@/features/clients/components/status-badge";
import type { ClientListQuery } from "@/features/clients/schemas";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/database.types";

const columns = [
  { id: "full_name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "status", label: "Status" },
  { id: "start_date", label: "Start date" },
] as const;

function sortHref(
  query: ClientListQuery,
  field: (typeof columns)[number]["id"],
) {
  const dir =
    query.sort === field && query.dir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  params.set("sort", field);
  params.set("dir", dir);
  params.set("page", "1");
  return `/clients?${params.toString()}`;
}

export function ClientsTable({
  clients,
  query,
}: {
  clients: Client[];
  query: ClientListQuery;
}) {
  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients match these filters"
        description="Try another search, or add a client to get started."
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const active = query.sort === column.id;
                return (
                  <TableHead key={column.id}>
                    <Link
                      href={sortHref(query, column.id)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-foreground",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {column.label}
                      {active ? (
                        query.dir === "asc" ? (
                          <ArrowUpIcon className="size-3.5" />
                        ) : (
                          <ArrowDownIcon className="size-3.5" />
                        )
                      ) : null}
                    </Link>
                  </TableHead>
                );
              })}
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${client.id}`} className="hover:underline">
                    {client.full_name}
                  </Link>
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <StatusBadge status={client.status} />
                </TableCell>
                <TableCell>{formatDate(client.start_date)}</TableCell>
                <TableCell>
                  <ClientRowActions client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {clients.map((client) => (
          <li key={client.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                  {client.full_name}
                </Link>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Started {formatDate(client.start_date)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status={client.status} />
                <ClientRowActions client={client} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
