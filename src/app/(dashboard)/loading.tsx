export default function DashboardRootLoading() {
  return (
    <div className="animate-pulse space-y-6 pt-2">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-16 rounded bg-border-subtle/50" />
      </div>

      {/* Page header skeleton */}
      <div className="h-8 w-64 rounded-lg bg-border-subtle/40" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-border-subtle/60" />
              <div className="h-4 w-8 rounded bg-border-subtle/40" />
            </div>
            <div className="h-3 w-20 rounded bg-border-subtle/50 mb-2" />
            <div className="h-7 w-32 rounded-lg bg-border-subtle/40 mb-1" />
            <div className="h-3 w-24 rounded bg-border-subtle/30" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-border-subtle/50" />
                <div className="h-3 w-24 rounded bg-border-subtle/30" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-14 rounded bg-border-subtle/30" />
                <div className="h-3 w-14 rounded bg-border-subtle/30" />
              </div>
            </div>
            <div className="h-[220px] w-full rounded-xl bg-border-subtle/20" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card">
              <div className="h-3 w-20 rounded bg-border-subtle/50 mb-2" />
              <div className="h-6 w-28 rounded-lg bg-border-subtle/40 mb-1" />
              <div className="h-3 w-16 rounded bg-border-subtle/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
