import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function DashboardPageLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-16 rounded bg-border-subtle/50" />
      </div>

      {/* Title */}
      <div className="h-8 w-72 rounded-lg bg-border-subtle/40" />

      {/* Row 1: 4 KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="md:col-span-3">
            <SkeletonCard />
          </div>
        ))}
      </div>

      {/* Row 2: Chart + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded bg-border-subtle/50" />
                <div className="h-3 w-28 rounded bg-border-subtle/30" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-16 rounded bg-border-subtle/30" />
                <div className="h-3 w-16 rounded bg-border-subtle/30" />
                <div className="h-3 w-16 rounded bg-border-subtle/30" />
              </div>
            </div>
            <div className="h-[240px] w-full rounded-xl bg-border-subtle/20" />
            <div className="mt-4 flex items-center gap-6 border-t border-border-subtle pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-border-subtle/40" />
                  <div className="h-5 w-24 rounded bg-border-subtle/30" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-5">
          <div className="dashboard-card">
            <div className="h-3 w-28 rounded bg-border-subtle/50 mb-2" />
            <div className="h-6 w-32 rounded-lg bg-border-subtle/40 mb-1" />
            <div className="h-3 w-20 rounded bg-border-subtle/30" />
          </div>
          <div className="dashboard-card">
            <div className="h-3 w-24 rounded bg-border-subtle/50 mb-2" />
            <div className="h-6 w-28 rounded-lg bg-border-subtle/40 mb-1" />
            <div className="h-3 w-16 rounded bg-border-subtle/30" />
          </div>
        </div>
      </div>

      {/* Row 3: Two charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="md:col-span-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-border-subtle/50" />
                  <div className="h-3 w-20 rounded bg-border-subtle/30" />
                </div>
              </div>
              <div className="h-[180px] w-full rounded-xl bg-border-subtle/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
