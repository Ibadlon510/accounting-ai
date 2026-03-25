import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-card";

export default function DocumentsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
      </div>

      {/* Title */}
      <div className="h-8 w-44 rounded-lg bg-border-subtle/40" />

      {/* Drop zone skeleton */}
      <div className="h-24 rounded-2xl border-2 border-dashed border-border-subtle/50 bg-border-subtle/10" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-xl bg-border-subtle/30" />
        ))}
      </div>

      {/* Table skeleton */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
