"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Wallet,
} from "lucide-react";

type CustomerOption = { id: string; name: string; email: string | null };

type PortalTokenRow = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  tokenPrefix: string;
  label: string | null;
  expiresAt: string;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  status: "active" | "expired" | "revoked";
};

type CreatedToken = PortalTokenRow & { shareUrl: string; rawToken: string };

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  expired: "bg-muted text-text-meta",
  revoked: "bg-error/10 text-error",
};

export default function ClientPortalPage() {
  usePageTitle("Client Portal");

  const [tokens, setTokens] = useState<PortalTokenRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [freshLink, setFreshLink] = useState<CreatedToken | null>(null);

  const loadTokens = useCallback(() => {
    return fetch("/api/client-portal/tokens", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { tokens: [] }))
      .then((d) => setTokens(d.tokens ?? []))
      .catch(() => setTokens([]));
  }, []);

  const loadCustomers = useCallback(() => {
    return fetch("/api/sales/customers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { customers: [] }))
      .then((d) => {
        const list = (d.customers ?? []).map(
          (c: { id: string; name: string; email?: string | null }) => ({
            id: c.id,
            name: c.name,
            email: c.email ?? null,
          })
        );
        setCustomers(list);
      })
      .catch(() => setCustomers([]));
  }, []);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([loadTokens(), loadCustomers()]).finally(() => setLoading(false));
  }, [loadTokens, loadCustomers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tokens;
    return tokens.filter(
      (t) =>
        t.customerName.toLowerCase().includes(q) ||
        (t.customerEmail ?? "").toLowerCase().includes(q) ||
        (t.label ?? "").toLowerCase().includes(q) ||
        t.tokenPrefix.toLowerCase().includes(q)
    );
  }, [tokens, search]);

  async function handleCreate() {
    if (!customerId) {
      showError("Choose a customer");
      return;
    }
    setCreating(true);
    setFreshLink(null);
    try {
      const res = await fetch("/api/client-portal/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          label: label.trim() || undefined,
          expiresInDays: Number(expiresInDays) || 30,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create portal link");
      setFreshLink(data.token as CreatedToken);
      showSuccess("Portal link created — copy it now; it won’t be shown again.");
      setLabel("");
      await loadTokens();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to create portal link");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/client-portal/tokens/${id}/revoke`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to revoke");
      showSuccess("Portal link revoked");
      if (freshLink?.id === id) setFreshLink(null);
      await loadTokens();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setRevokingId(null);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied");
    } catch {
      showError("Could not copy");
    }
  }

  const activeCount = tokens.filter((t) => t.status === "active").length;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Client Portal" },
        ]}
      />
      <PageHeader title="Client Portal" />
      <p className="mt-1 text-[13px] text-text-secondary">
        Share secure links so customers can view their statement and invoices without an account.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="dashboard-card">
          <div className="flex items-center gap-2 text-text-meta text-[12px]">
            <Wallet className="h-4 w-4" /> Active links
          </div>
          <p className="mt-2 text-[28px] font-semibold text-text-primary">{activeCount}</p>
        </div>
        <div className="dashboard-card md:col-span-2">
          <div className="flex items-center gap-2 text-text-meta text-[12px]">
            <Link2 className="h-4 w-4" /> How it works
          </div>
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
            Create a magic-token link for a customer. They open it to see their statement and
            invoices (HTML or PDF). Tokens are hashed at rest, expire automatically, and can be
            revoked anytime. Only that customer&apos;s data is exposed.
          </p>
        </div>
      </div>

      <div className="mt-6 dashboard-card">
        <h3 className="text-[15px] font-semibold text-text-primary">Create portal link</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-[12px] text-text-meta">Customer</label>
            <StyledSelect
              className="mt-1"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email ? `${c.name} (${c.email})` : c.name}
                </option>
              ))}
            </StyledSelect>
          </div>
          <div>
            <label className="text-[12px] text-text-meta">Label (optional)</label>
            <Input
              className="mt-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. March statement"
            />
          </div>
          <div>
            <label className="text-[12px] text-text-meta">Expires in (days)</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void handleCreate()} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {creating ? "Creating…" : "Create link"}
          </Button>
          <Button variant="outline" onClick={() => loadAll()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {freshLink && (
          <div className="mt-4 rounded-xl border border-success/30 bg-success/5 p-4">
            <p className="text-[13px] font-medium text-text-primary">
              New link for {freshLink.customerName} — copy now (shown once)
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-lg bg-canvas px-3 py-2 text-[12px] text-text-secondary">
                {freshLink.shareUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void copyText(freshLink.shareUrl)}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 dashboard-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[15px] font-semibold text-text-primary">Portal links</h3>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
            <Input
              className="pl-9"
              placeholder="Search customer, label, prefix…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-[13px] text-text-meta">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-[13px] text-text-meta">No portal links yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-meta">
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Label</th>
                  <th className="py-2 pr-3 font-medium">Prefix</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 pr-3 font-medium">Last access</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border-subtle/60">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-text-primary">{t.customerName}</div>
                      {t.customerEmail && (
                        <div className="text-[11px] text-text-meta">{t.customerEmail}</div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-text-secondary">{t.label || "—"}</td>
                    <td className="py-3 pr-3 font-mono text-text-meta">{t.tokenPrefix}…</td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                          statusStyles[t.status]
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-text-secondary">
                      {new Date(t.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-3 text-text-secondary">
                      {t.lastAccessedAt
                        ? new Date(t.lastAccessedAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="py-3">
                      {t.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={revokingId === t.id}
                          onClick={() => void handleRevoke(t.id)}
                        >
                          {revokingId === t.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5" />
                          )}
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
