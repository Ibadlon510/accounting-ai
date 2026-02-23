"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Landmark, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, FileCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DashboardPill } from "@/components/dashboard/dashboard-pill";

const navItems = [
  { href: "/banking", label: "Accounts", icon: Landmark },
  { href: "/banking/receipts", label: "Receipts", icon: ArrowDownLeft },
  { href: "/banking/payments", label: "Payments", icon: ArrowUpRight },
  { href: "/banking/transfers", label: "Inter-account Transfers", icon: ArrowLeftRight },
  { href: "/banking/reconciliation", label: "Reconciliation", icon: FileCheck },
];

const titleByPath: Record<string, string> = {
  "/banking": "Accounts",
  "/banking/receipts": "Receipts",
  "/banking/payments": "Payments",
  "/banking/transfers": "Inter-account Transfers",
  "/banking/reconciliation": "Reconciliation",
};

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = titleByPath[pathname] ?? "Banking";

  return (
    <>
      <Breadcrumbs
        items={
          pathname === "/banking"
            ? [
                { label: "Workspaces", href: "/workspaces" },
                { label: "Banking" },
              ]
            : [
                { label: "Workspaces", href: "/workspaces" },
                { label: "Banking", href: "/banking" },
                { label: pageTitle },
              ]
        }
      />
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">{pageTitle}</h1>
        <nav className="flex items-center gap-1">
          <DashboardPill />
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/banking" && pathname.startsWith(item.href));
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
