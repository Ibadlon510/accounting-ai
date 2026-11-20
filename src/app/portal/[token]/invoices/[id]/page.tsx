"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatNumber } from "@/lib/accounting/engine";
import { AlertCircle, ArrowLeft, Download, Loader2 } from "lucide-react";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  paymentInfo: string | null;
  customerName: string;
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }[];
};

function PortalInvoiceContent({
  token,
  invoiceId,
}: {
  token: string;
  invoiceId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(
      `/api/portal/${encodeURIComponent(token)}/invoices/${encodeURIComponent(invoiceId)}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Invoice not found");
        if (cancelled) return;
        setOrgName(data.organization?.name ?? "");
        setInvoice(data.invoice);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load invoice");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Invoice unavailable</h1>
        <p className="mt-2 text-sm text-stone-600">{error}</p>
        <Link
          href={`/portal/${encodeURIComponent(token)}`}
          className="mt-4 text-sm font-medium text-emerald-800 hover:underline"
        >
          Back to portal
        </Link>
      </div>
    );
  }

  const ccy = invoice.currency || "AED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/portal/${encodeURIComponent(token)}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to statement
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
            {orgName || "Invoice"}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-stone-900">{invoice.invoiceNumber}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {invoice.customerName} · Issued {invoice.issueDate} · Due {invoice.dueDate}
          </p>
          <span className="mt-2 inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-stone-700">
            {invoice.status}
          </span>
        </div>
        <a
          href={`/api/portal/${encodeURIComponent(token)}/invoices/${invoice.id}/pdf`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800"
        >
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-stone-100 bg-stone-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-1 text-right">Tax</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        {invoice.lines.map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-12 gap-2 border-b border-stone-50 px-4 py-3 text-sm text-stone-800"
          >
            <div className="col-span-5">{line.description}</div>
            <div className="col-span-2 text-right font-mono text-stone-600">
              {line.quantity}
            </div>
            <div className="col-span-2 text-right font-mono text-stone-600">
              {formatNumber(line.unitPrice)}
            </div>
            <div className="col-span-1 text-right text-stone-500">{line.taxRate}%</div>
            <div className="col-span-2 text-right font-mono">{formatNumber(line.amount)}</div>
          </div>
        ))}
        <div className="space-y-1 px-4 py-4 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-mono">
              {ccy} {formatNumber(invoice.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Tax</span>
            <span className="font-mono">
              {ccy} {formatNumber(invoice.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold text-stone-900">
            <span>Total</span>
            <span className="font-mono">
              {ccy} {formatNumber(invoice.total)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Paid</span>
            <span className="font-mono">
              {ccy} {formatNumber(invoice.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between font-medium text-amber-800">
            <span>Amount due</span>
            <span className="font-mono">
              {ccy} {formatNumber(invoice.amountDue)}
            </span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.terms || invoice.paymentInfo) && (
        <div className="mt-6 space-y-3 text-sm text-stone-600">
          {invoice.paymentInfo && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Payment info
              </p>
              <p className="mt-1 whitespace-pre-wrap">{invoice.paymentInfo}</p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Terms
              </p>
              <p className="mt-1 whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalInvoicePage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const invoiceId = String(params.id ?? "");

  if (!token || !invoiceId) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Invoice unavailable</h1>
      </div>
    );
  }

  return (
    <PortalInvoiceContent
      key={`${token}-${invoiceId}`}
      token={token}
      invoiceId={invoiceId}
    />
  );
}
