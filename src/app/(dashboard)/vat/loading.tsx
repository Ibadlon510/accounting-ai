import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-card";

export default function VatLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-12 rounded bg-border-subtle/50" />
      </div>

      {/* Title */}
      <div className="h-8 w-48 rounded-lg bg-border-subtle/40" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* VAT return table */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
