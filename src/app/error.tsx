"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-error/10">
          <span className="text-[32px]">⚠️</span>
        </div>
        <h1 className="text-[28px] font-bold text-text-primary">Something went wrong</h1>
        <p className="mt-2 max-w-md text-[15px] text-text-secondary">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 text-[12px] text-text-meta">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center rounded-xl bg-text-primary px-6 text-[14px] font-semibold text-white hover:bg-text-primary/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-xl border border-border-subtle px-6 text-[14px] font-medium text-text-primary hover:bg-black/5 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
