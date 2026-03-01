import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-text-primary/10">
          <span className="text-[40px] font-extrabold text-text-primary">404</span>
        </div>
        <h1 className="text-[28px] font-bold text-text-primary">Page not found</h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-xl bg-text-primary px-6 text-[14px] font-semibold text-white hover:bg-text-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xl border border-border-subtle px-6 text-[14px] font-medium text-text-primary hover:bg-black/5 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
