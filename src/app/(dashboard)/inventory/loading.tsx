import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-card";

export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-16 rounded bg-border-subtle/50" />
      </div>

      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg bg-border-subtle/40" />
        <div className="h-10 w-32 rounded-xl bg-border-subtle/50" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
