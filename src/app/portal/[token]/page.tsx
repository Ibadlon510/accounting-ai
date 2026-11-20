"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatNumber } from "@/lib/accounting/engine";
import {
  FileText,
  Loader2,
  AlertCircle,
  Download,
  ChevronRight,
} from "lucide-react";

type PortalData = {
  organization: { name: string; currency: string };
  customer: { name: string; email: string | null };
  expiresAt: string;
  summary: {
    balance: number;
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
  };
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountDue: number;
  status: string;
  currency: string;
};

const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-700",
};

function PortalContent({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/portal/${encodeURIComponent(token)}`, { cache: "no-store" }),
      fetch(`/api/portal/${encodeURIComponent(token)}/invoices`, { cache: "no-store" }),
    ])
      .then(async ([summaryRes, invRes]) => {
        if (!summaryRes.ok) {
          const err = await summaryRes.json().catch(() => ({}));
          throw new Error(err.error || "Invalid or expired portal link");
        }
        const summary = await summaryRes.json();
        const invData = invRes.ok ? await invRes.json() : { invoices: [] };
        if (cancelled) return;
        setData(summary);
        setInvoices(invData.invoices ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load portal");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Link unavailable</h1>
        <p className="mt-2 text-sm text-stone-600">
          {error || "This portal link is invalid, revoked, or expired."}
        </p>
      </div>
    );
  }

  const ccy = data.organization.currency || "AED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
          Client portal
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">
          {data.organization.name}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Statement &amp; invoices for <span className="font-medium text-stone-800">{data.customer.name}</span>
          {data.customer.email ? ` · ${data.customer.email}` : ""}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Link expires {new Date(data.expiresAt).toLocaleString()}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Outstanding", value: data.summary.balance },
          { label: "Invoiced", value: data.summary.totalInvoiced },
          { label: "Paid", value: data.summary.totalPaid },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-stone-200/80 bg-white/80 p-4 shadow-sm backdrop-blur"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-stone-900">
              {ccy} {formatNumber(item.value)}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-900">Invoices</h2>
          <span className="text-xs text-stone-500">{data.summary.invoiceCount} documents</span>
        </div>

        {invoices.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">No invoices to show.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
                    <FileText className="h-4 w-4 text-stone-600" />
                  </div>
                  <div>
                    <Link
                      href={`/portal/${encodeURIComponent(token)}/invoices/${inv.id}`}
                      className="font-medium text-stone-900 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-xs text-stone-500">
                      Issued {inv.issueDate}
                      {inv.dueDate ? ` · Due ${inv.dueDate}` : ""}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[inv.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <div className="text-right">
                    <p className="font-mono text-sm text-stone-900">
                      {inv.currency || ccy} {formatNumber(inv.total)}
                    </p>
                    {inv.amountDue > 0 && (
                      <p className="text-[11px] text-amber-700">
                        Due {formatNumber(inv.amountDue)}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/api/portal/${encodeURIComponent(token)}/invoices/${inv.id}/pdf`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                  <Link
                    href={`/portal/${encodeURIComponent(token)}/invoices/${inv.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                    aria-label="View invoice"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-stone-400">
        Read-only portal · Powered by Agar Smart Accounting
      </p>
    </div>
  );
}

export default function PublicPortalPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Link unavailable</h1>
      </div>
    );
  }
  return <PortalContent key={token} token={token} />;
}
