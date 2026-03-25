import { SkeletonTable } from "@/components/ui/skeleton-card";

export default function AccountingLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Action bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-56 rounded-xl bg-border-subtle/40" />
        <div className="h-10 w-28 rounded-xl bg-border-subtle/50" />
      </div>

      {/* Table skeleton */}
      <SkeletonTable rows={10} cols={5} />
    </div>
  );
}
