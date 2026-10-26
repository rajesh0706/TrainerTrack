import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ClientListQuery } from "@/features/clients/schemas";

export function ClientsPagination({
  query,
  page,
  pageCount,
  total,
}: {
  query: ClientListQuery;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (total === 0) return null;

  function href(nextPage: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    params.set("status", query.status);
    params.set("sort", query.sort);
    params.set("dir", query.dir);
    params.set("page", String(nextPage));
    return `/clients?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
      <p>
        Page {page} of {pageCount} · {total} clients
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={page <= 1 ? undefined : <Link href={href(page - 1)} />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          render={page >= pageCount ? undefined : <Link href={href(page + 1)} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
