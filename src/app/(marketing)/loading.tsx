export default function MarketingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse space-y-8 w-full max-w-5xl px-8">
        {/* Hero skeleton */}
        <div className="text-center space-y-4 py-16">
          <div className="mx-auto h-10 w-80 rounded-lg bg-border-subtle/40" />
          <div className="mx-auto h-5 w-96 rounded bg-border-subtle/30" />
          <div className="mx-auto h-5 w-72 rounded bg-border-subtle/20" />
          <div className="mx-auto mt-6 h-12 w-40 rounded-2xl bg-border-subtle/40" />
        </div>
      </div>
    </div>
  );
}
