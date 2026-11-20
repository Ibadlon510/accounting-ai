import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function ExpenseClaimsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-border-subtle/40" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-border-subtle/20" />
    </div>
  );
}
