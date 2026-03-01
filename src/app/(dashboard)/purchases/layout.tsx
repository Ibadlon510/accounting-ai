"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, Users, Receipt, RotateCcw } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DashboardPill } from "@/components/dashboard/dashboard-pill";

const navItems = [
  { href: "/purchases/bills", label: "Bills", icon: FileText },
  { href: "/purchases/expenses", label: "Expenses", icon: Receipt },
  { href: "/purchases/credit-notes", label: "Credit Notes", icon: RotateCcw },
  { href: "/purchases/suppliers", label: "Suppliers", icon: Users },
];

const titleByPath: Record<string, string> = {
  "/purchases": "Purchases",
  "/purchases/bills": "Bills",
  "/purchases/expenses": "Expenses",
  "/purchases/credit-notes": "Credit Notes",
  "/purchases/suppliers": "Suppliers",
};

export default function PurchasesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = titleByPath[pathname] ?? "Purchases";

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Purchases", href: "/purchases" }, ...(pathname !== "/purchases" ? [{ label: pageTitle }] : [])]} />
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">{pageTitle}</h1>
        <nav className="flex items-center gap-1">
          <DashboardPill />
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
