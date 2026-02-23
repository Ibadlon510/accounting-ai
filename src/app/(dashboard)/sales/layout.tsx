"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, Users, CreditCard, ScrollText } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DashboardPill } from "@/components/dashboard/dashboard-pill";

const navItems = [
  { href: "/sales/invoices", label: "Invoices", icon: FileText },
  { href: "/sales/customers", label: "Customers", icon: Users },
  { href: "/sales/payments", label: "Payments Received", icon: CreditCard },
  { href: "/sales/statements", label: "Statements", icon: ScrollText },
];

const titleByPath: Record<string, string> = {
  "/sales": "Sales",
  "/sales/invoices": "Invoices",
  "/sales/customers": "Customers",
  "/sales/payments": "Payments Received",
  "/sales/statements": "Statements",
};

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = titleByPath[pathname] ?? "Sales";

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Sales", href: "/sales" }, ...(pathname !== "/sales" ? [{ label: pageTitle }] : [])]} />
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
