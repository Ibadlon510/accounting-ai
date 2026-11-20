"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { Copy, Link2, Loader2, Plus, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PortalTokenRow = {
  id: string;
  tokenPrefix: string;
  label: string | null;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  shareUrl?: string;
};

export function CustomerPortalLinks({ customerId }: { customerId: string }) {
  const [tokens, setTokens] = useState<PortalTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    return fetch(`/api/client-portal/tokens?customerId=${encodeURIComponent(customerId)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { tokens: [] }))
      .then((d) => setTokens(d.tokens ?? []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLink() {
    setCreating(true);
    setFreshUrl(null);
    try {
      const res = await fetch("/api/client-portal/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          label: label.trim() || undefined,
          expiresInDays: 30,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      setFreshUrl(data.token.shareUrl);
      setLabel("");
      showSuccess("Portal link created");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    try {
      const res = await fetch(`/api/client-portal/tokens/${id}/revoke`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to revoke");
      showSuccess("Link revoked");
      await load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to revoke");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border-subtle p-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-text-meta" />
        <h4 className="text-[13px] font-semibold text-text-primary">Client Portal</h4>
      </div>
      <p className="mt-1 text-[12px] text-text-secondary">
        Share a secure link so this customer can view their statement and invoices.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Optional label"
          className="h-8 text-[12px]"
        />
        <Button size="sm" onClick={() => void createLink()} disabled={creating} className="shrink-0">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create link
        </Button>
      </div>

      {freshUrl && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-success/5 p-2 sm:flex-row sm:items-center">
          <code className="flex-1 break-all text-[11px] text-text-secondary">{freshUrl}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(freshUrl).then(
                () => showSuccess("Copied"),
                () => showError("Could not copy")
              );
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      )}

      {loading ? (
        <p className="mt-3 text-[12px] text-text-meta">Loading links…</p>
      ) : tokens.length === 0 ? (
        <p className="mt-3 text-[12px] text-text-meta">No portal links for this customer.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tokens.slice(0, 5).map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-2.5 py-2 text-[12px]"
            >
              <div>
                <span className="font-mono text-text-meta">{t.tokenPrefix}…</span>
                {t.label ? <span className="ml-2 text-text-secondary">{t.label}</span> : null}
                <span
                  className={cn(
                    "ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                    t.status === "active"
                      ? "bg-success/10 text-success"
                      : t.status === "revoked"
                        ? "bg-error/10 text-error"
                        : "bg-muted text-text-meta"
                  )}
                >
                  {t.status}
                </span>
                <div className="text-[10px] text-text-meta">
                  Expires {new Date(t.expiresAt).toLocaleDateString()}
                </div>
              </div>
              {t.status === "active" && (
                <Button size="sm" variant="ghost" onClick={() => void revoke(t.id)}>
                  <ShieldOff className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
