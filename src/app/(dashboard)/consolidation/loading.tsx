export default function ConsolidationLoading() {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-96 max-w-full rounded bg-muted" />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-2xl bg-muted lg:col-span-1" />
        <div className="h-64 rounded-2xl bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}
