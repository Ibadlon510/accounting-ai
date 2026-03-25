import { SkeletonTable } from "@/components/ui/skeleton-card";

export default function PurchasesLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Action bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-64 rounded-xl bg-border-subtle/40" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 rounded-xl bg-border-subtle/30" />
          <div className="h-10 w-32 rounded-xl bg-border-subtle/50" />
        </div>
      </div>

      {/* Table skeleton */}
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
