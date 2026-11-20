"use client";

import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FolderKanban,
  GitMerge,
  Link2,
  Package,
  PiggyBank,
  Users,
  Wallet,
  ArrowRight,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PRODUCT_MODULES, type ProductModuleCard } from "@/lib/modules/product-modules";
import { cn } from "@/lib/utils";
import { comingSoon } from "@/lib/utils/toast-helpers";

const ICONS: Record<string, LucideIcon> = {
  "fixed-assets": Building2,
  "expense-claims": ClipboardList,
  budgets: PiggyBank,
  projects: FolderKanban,
  "payroll-full": Users,
  "client-portal": Wallet,
  "payment-links": Link2,
  "inventory-advanced": Package,
  consolidation: GitMerge,
};

function ModuleCard({ module }: { module: ProductModuleCard }) {
  const Icon = ICONS[module.id] ?? Building2;
  const ready = module.status === "ready" && module.href;

  const inner = (
    <div
      className={cn(
        "dashboard-card h-full transition-all",
        ready
          ? "cursor-pointer hover:shadow-lg group"
          : "opacity-90 cursor-not-allowed"
      )}
      onClick={() => {
        if (!ready) comingSoon(module.title);
      }}
      role={ready ? undefined : "button"}
      tabIndex={ready ? undefined : 0}
      onKeyDown={(e) => {
        if (!ready && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          comingSoon(module.title);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
          <Icon className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
        </div>
        {ready ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
            Ready
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold text-text-meta">
            <Lock className="h-3 w-3" />
            Not ready yet
          </span>
        )}
      </div>
      <h3 className="mt-4 text-[16px] font-semibold text-text-primary">{module.title}</h3>
      <p className="mt-1 text-[13px] text-text-secondary">{module.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {module.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-text-meta"
          >
            {tag}
          </span>
        ))}
      </div>
      {module.note && (
        <p className="mt-3 text-[11px] leading-relaxed text-text-meta">{module.note}</p>
      )}
    </div>
  );

  if (ready && module.href) {
    return (
      <Link href={module.href} className="block h-full">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function ComingSoonGrid({
  title = "Coming soon",
  subtitle = "Post-MVP modules. Ready cards open the live workspace; others stay locked until shipped.",
  modules = PRODUCT_MODULES,
}: {
  title?: string;
  subtitle?: string;
  modules?: ProductModuleCard[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-[13px] text-text-secondary">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}
