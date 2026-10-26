import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLIENT_STATUSES, type ClientListQuery } from "@/features/clients/schemas";
import { STATUS_LABELS } from "@/features/clients/labels";

export function ClientsFilters({ query }: { query: ClientListQuery }) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <input type="hidden" name="sort" value={query.sort} />
      <input type="hidden" name="dir" value={query.dir} />
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="client-search">Search</Label>
        <Input
          id="client-search"
          name="q"
          defaultValue={query.q}
          placeholder="Name or email"
          type="search"
        />
      </div>
      <div className="grid gap-1.5 sm:w-44">
        <Label htmlFor="client-status">Status</Label>
        <select
          id="client-status"
          name="status"
          defaultValue={query.status}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="all">All</option>
          {CLIENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
