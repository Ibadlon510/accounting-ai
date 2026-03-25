export default function WorkspacesLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-pulse w-full max-w-lg space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-7 w-48 rounded-lg bg-border-subtle/40" />
          <div className="mx-auto h-4 w-64 rounded bg-border-subtle/30" />
        </div>

        {/* Workspace cards */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-border-subtle/50 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded bg-border-subtle/50" />
                <div className="h-3 w-48 rounded bg-border-subtle/30" />
              </div>
              <div className="h-8 w-16 rounded-lg bg-border-subtle/30" />
            </div>
          ))}
        </div>

        {/* Create button skeleton */}
        <div className="mx-auto h-11 w-48 rounded-xl bg-border-subtle/30" />
      </div>
    </div>
  );
}
