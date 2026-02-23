"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { TrendingUp, BarChart3, Package, Receipt } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const navItems = [
  { href: "/reports/profit-and-loss", label: "Profit & Loss", icon: TrendingUp },
  { href: "/reports/balance-sheet", label: "Balance Sheet", icon: BarChart3 },
  { href: "/reports/inventory-valuation", label: "Inventory Valuation", icon: Package },
  { href: "/reports/vat-audit", label: "VAT Audit", icon: Receipt },
];

const titleByPath: Record<string, string> = {
  "/reports": "Reports",
  "/reports/profit-and-loss": "Profit & Loss",
  "/reports/balance-sheet": "Balance Sheet",
  "/reports/inventory-valuation": "Inventory Valuation",
  "/reports/vat-audit": "VAT Audit",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = titleByPath[pathname] ?? "Reports";

  return (
    <>
      <Breadcrumbs
        items={
          pathname === "/reports"
            ? [
                { label: "Workspaces", href: "/workspaces" },
                { label: "Reports" },
              ]
            : [
                { label: "Workspaces", href: "/workspaces" },
                { label: "Reports", href: "/reports" },
                { label: pageTitle },
              ]
        }
      />
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">{pageTitle}</h1>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-text-primary text-white"
                    : "bg-muted/60 text-text-secondary hover:bg-muted hover:text-text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </>
  );
}
