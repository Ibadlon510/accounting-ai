"use client";

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="md:col-span-2 xl:col-span-3">
        <div className="dashboard-card animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 px-4">
                <div className="h-3 w-16 rounded-lg bg-border-subtle/60" />
                <div className="h-6 w-24 rounded-lg bg-border-subtle/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <div className="dashboard-card animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <div className="h-9 w-9 rounded-lg bg-border-subtle/60 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-border-subtle/60" />
                  <div className="h-5 w-28 rounded bg-border-subtle/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`chart-${i}`} className="dashboard-card animate-pulse">
          <div className="h-4 w-28 rounded bg-border-subtle/60 mb-2" />
          <div className="h-3 w-20 rounded bg-border-subtle/40 mb-4" />
          <div className="h-[180px] w-full rounded-xl bg-border-subtle/30" />
        </div>
      ))}
      <div className="dashboard-card animate-pulse">
        <div className="h-4 w-28 rounded bg-border-subtle/60 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="h-5 w-5 rounded-full bg-border-subtle/50" />
            <div className="flex-1 h-4 rounded bg-border-subtle/40" />
            <div className="h-4 w-20 rounded bg-border-subtle/50" />
          </div>
        ))}
      </div>
      <div className="md:col-span-2 xl:col-span-3 dashboard-card animate-pulse">
        <div className="h-4 w-28 rounded bg-border-subtle/60 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="h-5 w-5 rounded-full bg-border-subtle/50" />
            <div className="flex-1 h-4 rounded bg-border-subtle/40" />
            <div className="h-4 w-20 rounded bg-border-subtle/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
