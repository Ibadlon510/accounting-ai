export default function ReportsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-xl bg-border-subtle/40" />
        <div className="h-10 w-40 rounded-xl bg-border-subtle/40" />
        <div className="h-10 w-28 rounded-xl bg-border-subtle/50" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card">
            <div className="h-3 w-20 rounded bg-border-subtle/50 mb-2" />
            <div className="h-6 w-28 rounded-lg bg-border-subtle/40" />
          </div>
        ))}
      </div>

      {/* Report table skeleton */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="flex items-center gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-border-subtle/40" style={{ flex: i === 0 ? 3 : 1 }} />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border-subtle/50 px-6 py-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 rounded bg-border-subtle/30" style={{ flex: j === 0 ? 3 : 1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
