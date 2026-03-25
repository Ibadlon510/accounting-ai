import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function BankingLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* AI Insight banner skeleton */}
      <div className="dashboard-card !py-3.5 !px-5 border-l-4 border-l-border-subtle/40 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-border-subtle/50 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-16 rounded bg-border-subtle/50" />
          <div className="h-3 w-64 rounded bg-border-subtle/30" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Account cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 rounded bg-border-subtle/50" />
          <div className="h-3 w-24 rounded bg-border-subtle/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-border-subtle/50" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-border-subtle/50" />
                  <div className="h-3 w-20 rounded bg-border-subtle/30" />
                </div>
              </div>
              <div className="h-6 w-32 rounded-lg bg-border-subtle/40 mb-2" />
              <div className="h-3 w-24 rounded bg-border-subtle/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard section skeleton */}
      <div className="dashboard-card">
        <div className="h-4 w-28 rounded bg-border-subtle/50 mb-4" />
        <div className="h-[180px] w-full rounded-xl bg-border-subtle/20" />
      </div>
    </div>
  );
}
