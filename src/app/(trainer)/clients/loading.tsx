import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="flex gap-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-44" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
