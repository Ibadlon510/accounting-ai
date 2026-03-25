export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-border-subtle/50" />
        <div className="h-3 w-3 rounded bg-border-subtle/30" />
        <div className="h-3 w-16 rounded bg-border-subtle/50" />
      </div>

      {/* Title */}
      <div className="h-8 w-32 rounded-lg bg-border-subtle/40" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-border-subtle/30" />
        ))}
      </div>

      {/* Settings form skeleton */}
      <div className="dashboard-card space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-border-subtle/50" />
            <div className="h-10 w-full rounded-xl bg-border-subtle/20" />
          </div>
        ))}
        <div className="h-10 w-32 rounded-xl bg-border-subtle/40" />
      </div>
    </div>
  );
}
