"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { usePageTitle } from "@/hooks/use-page-title";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { cn } from "@/lib/utils";
import {
  Copy,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  CheckCircle2,
} from "lucide-react";

type InvoiceOption = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amountDue: number;
  status: string;
};

type BankOption = { id: string; accountName: string };

type PaymentLinkRow = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  checkoutUrl: string | null;
  paymentId: string | null;
  journalEntryId: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-text-meta",
  open: "bg-blue-100 text-blue-700",
  paid: "bg-success/10 text-success",
  expired: "bg-muted text-text-meta",
  cancelled: "bg-error/10 text-error",
  failed: "bg-error/10 text-error",
};

function PaymentLinksContent() {
  usePageTitle("Payments Collection");
  const searchParams = useSearchParams();

  const [links, setLinks] = useState<PaymentLinkRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);

  const loadLinks = useCallback(() => {
    return fetch("/api/payment-links", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { links: [] }))
      .then((d) => {
        setLinks(d.links ?? []);
        setStripeConfigured(Boolean(d.stripeConfigured));
      })
      .catch(() => setLinks([]));
  }, []);

  const loadInvoices = useCallback(() => {
    return fetch("/api/sales/invoices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((d) => {
        const list = (d.invoices ?? [])
          .filter(
            (inv: { status: string; amountDue: number }) =>
              inv.status !== "draft" &&
              inv.status !== "cancelled" &&
              Number(inv.amountDue) > 0
          )
          .map(
            (inv: {
              id: string;
              invoiceNumber: string;
              customerName: string;
              amountDue: number;
              status: string;
            }) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              customerName: inv.customerName,
              amountDue: Number(inv.amountDue),
              status: inv.status,
            })
          );
        setInvoices(list);
      })
      .catch(() => setInvoices([]));
  }, []);

  const loadBanks = useCallback(() => {
    return fetch("/api/banking", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        const list = (d.accounts ?? [])
          .filter((a: { isActive?: boolean }) => a.isActive !== false)
          .map((a: { id: string; accountName: string }) => ({
            id: a.id,
            accountName: a.accountName,
          }));
        setBanks(list);
        setBankAccountId((prev) => prev || list[0]?.id || "");
      })
      .catch(() => setBanks([]));
  }, []);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([loadLinks(), loadInvoices(), loadBanks()]).finally(() =>
      setLoading(false)
    );
  }, [loadLinks, loadInvoices, loadBanks]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (searchParams.get("paid") === "1") {
      showSuccess(
        "Payment received",
        "Settlement appears once the webhook posts the receipt journal."
      );
      loadLinks();
    }
    if (searchParams.get("canceled") === "1") {
      showError("Checkout canceled");
    }
  }, [searchParams, loadLinks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return links;
    return links.filter(
      (l) =>
        l.invoiceNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.provider.toLowerCase().includes(q)
    );
  }, [links, search]);

  async function handleCreate() {
    if (!invoiceId) {
      showError("Choose an invoice with an amount due");
      return;
    }
    setCreating(true);
    setFreshUrl(null);
    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          bankAccountId: bankAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create payment link");
        return;
      }
      const url = json.link?.checkoutUrl as string | undefined;
      setFreshUrl(url ?? null);
      showSuccess(
        "Payment link created",
        json.link?.provider === "stub"
          ? "Stripe is not configured — using stub provider link."
          : "Share the Stripe Checkout URL with your customer."
      );
      setInvoiceId("");
      await loadLinks();
    } finally {
      setCreating(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Link copied");
    } catch {
      showError("Could not copy link");
    }
  }

  async function cancelLink(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/payment-links/${id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Cancel failed");
        return;
      }
      showSuccess("Payment link cancelled");
      await loadLinks();
    } finally {
      setBusyId(null);
    }
  }

  async function settleStub(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/payment-links/${id}/settle-stub`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Settlement failed");
        return;
      }
      showSuccess(
        "Settled",
        json.result?.alreadySettled
          ? "Already allocated."
          : "Invoice allocated and receipt JE posted."
      );
      await loadLinks();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Payments Collection" },
        ]}
      />
      <PageHeader title="Payments Collection" />
      <p className="text-[13px] text-text-secondary">
        Add payment links to invoices and reconcile what settles. Receipt journals
        debit cash/bank (or 1010) and credit AR 1210 — reverse-only.
      </p>

      {!stripeConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Stripe is not configured (<code className="text-[12px]">STRIPE_SECRET_KEY</code>).
          Links use the stub provider — settle via “Simulate settlement” or{" "}
          <code className="text-[12px]">POST /api/payment-links/webhook</code> with{" "}
          <code className="text-[12px]">PAYMENT_LINKS_STUB_SECRET</code>.
        </div>
      )}

      <div className="dashboard-card space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-text-primary" />
          <h2 className="text-[15px] font-semibold text-text-primary">New payment link</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StyledSelect
            className="h-10"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            <option value="">Select invoice…</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} · {inv.customerName} · {inv.amountDue.toFixed(2)} due
              </option>
            ))}
          </StyledSelect>
          <StyledSelect
            className="h-10"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
          >
            <option value="">Settlement bank…</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.accountName}
              </option>
            ))}
          </StyledSelect>
          <Button
            onClick={handleCreate}
            disabled={creating || !invoiceId}
            className="h-10 gap-2 rounded-xl bg-text-primary text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create link
          </Button>
        </div>
        {freshUrl && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-[13px]">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="truncate font-mono text-[12px] text-text-secondary">{freshUrl}</span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto gap-1.5 rounded-lg text-[12px]"
              onClick={() => copyUrl(freshUrl)}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search links…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px]"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-[12px]"
          onClick={loadAll}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        {loading ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">
            No payment links yet. Create one from an open invoice.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filtered.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-text-primary">
                      {link.invoiceNumber}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                        statusStyles[link.status] ?? statusStyles.pending
                      )}
                    >
                      {link.status}
                    </span>
                    <span className="rounded-md bg-canvas px-2 py-0.5 text-[11px] text-text-meta">
                      {link.provider}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary">
                    {link.customerName} · {link.currency} {link.amount.toFixed(2)}
                    {link.paidAt
                      ? ` · settled ${new Date(link.paidAt).toLocaleString()}`
                      : link.expiresAt
                        ? ` · expires ${new Date(link.expiresAt).toLocaleString()}`
                        : ""}
                  </p>
                  {link.journalEntryId && (
                    <p className="text-[11px] text-text-meta">
                      Receipt JE linked · payment {link.paymentId?.slice(0, 8)}…
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {link.checkoutUrl &&
                    (link.status === "open" || link.status === "pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-xl text-[12px]"
                        onClick={() => copyUrl(link.checkoutUrl!)}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy link
                      </Button>
                    )}
                  {(link.status === "open" || link.status === "pending") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-xl text-[12px]"
                      disabled={busyId === link.id}
                      onClick={() => cancelLink(link.id)}
                    >
                      <ShieldOff className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                  {link.provider === "stub" &&
                    (link.status === "open" || link.status === "pending") && (
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-xl bg-success px-3 text-[12px] text-white hover:bg-success/90"
                        disabled={busyId === link.id}
                        onClick={() => settleStub(link.id)}
                      >
                        {busyId === link.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Simulate settlement
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentLinksPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading…</div>
      }
    >
      <PaymentLinksContent />
    </Suspense>
  );
}
