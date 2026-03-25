export default function AuthLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-border-subtle/40" />
        <div className="h-4 w-56 rounded bg-border-subtle/30" />
      </div>

      {/* AI badge */}
      <div className="h-9 w-full rounded-xl bg-border-subtle/20" />

      {/* OAuth buttons */}
      <div className="space-y-2">
        <div className="h-11 w-full rounded-xl bg-border-subtle/30" />
        <div className="h-11 w-full rounded-xl bg-border-subtle/30" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border-subtle/40" />
        <div className="h-3 w-6 rounded bg-border-subtle/30" />
        <div className="h-px flex-1 bg-border-subtle/40" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-3 w-12 rounded bg-border-subtle/40" />
          <div className="h-11 w-full rounded-xl bg-border-subtle/20" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-border-subtle/40" />
          <div className="h-11 w-full rounded-xl bg-border-subtle/20" />
        </div>
        <div className="h-11 w-full rounded-xl bg-border-subtle/40" />
      </div>

      {/* Footer link */}
      <div className="flex justify-center">
        <div className="h-3 w-40 rounded bg-border-subtle/20" />
      </div>
    </div>
  );
}
