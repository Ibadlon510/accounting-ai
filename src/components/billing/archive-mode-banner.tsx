"use client";

import Link from "next/link";
import { Archive, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsArchived } from "@/hooks/use-organization";

export function ArchiveModeBanner() {
  const { isArchived, loading } = useIsArchived();

  if (loading || !isArchived) return null;

  return (
    <div className="mx-8 mb-4 mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
            <Archive className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              This workspace is archived
            </p>
            <p className="text-[12px] text-slate-600">
              You can view documents and reports, but creating or editing data is disabled until you renew.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-lg bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800"
        >
          <Link href="/settings?tab=billing">
            Renew / Restore
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
