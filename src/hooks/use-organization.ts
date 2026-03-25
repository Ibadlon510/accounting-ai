"use client";

import { useCallback, useEffect, useState } from "react";

const CURRENT_ORG_COOKIE = "current_org_id";

type OrgData = {
  id: string;
  name: string;
  currency: string;
  isVatRegistered: boolean;
  taxLabel: string;
  defaultTaxCodeId: string | null;
  role: string;
};

export function useOrganization() {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org/current", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setOrg(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { org, loading };
}

/**
 * Client-side hook to read current org ID from document.cookie (for display).
 * For API calls, use server getCurrentOrganizationId() so cookie is in request.
 */
export function useCurrentOrgId(): string | null {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Try reading from document.cookie first (works when cookie is not httpOnly)
    const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENT_ORG_COOKIE}=([^;]*)`));
    if (match) {
      setOrgId(decodeURIComponent(match[1]));
      return;
    }

    // Fallback: fetch from server (handles legacy httpOnly cookies)
    fetch("/api/org/current-id", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orgId) setOrgId(data.orgId);
      })
      .catch(() => {});
  }, []);

  return orgId;
}

type OrgConfig = {
  currency: string;
  taxLabel: string;
  isVatRegistered: boolean;
};

const orgConfigCache: { data: OrgConfig | null; promise: Promise<OrgConfig> | null } = {
  data: null,
  promise: null,
};

export function useOrgConfig(): OrgConfig {
  const [config, setConfig] = useState<OrgConfig>({
    currency: "AED",
    taxLabel: "VAT",
    isVatRegistered: false,
  });

  useEffect(() => {
    if (orgConfigCache.data) {
      setConfig(orgConfigCache.data);
      return;
    }
    if (!orgConfigCache.promise) {
      orgConfigCache.promise = fetch("/api/org/current", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const cfg: OrgConfig = {
            currency: data?.currency ?? "AED",
            taxLabel: data?.taxLabel ?? "VAT",
            isVatRegistered: data?.isVatRegistered ?? false,
          };
          orgConfigCache.data = cfg;
          return cfg;
        });
    }
    orgConfigCache.promise.then((cfg) => setConfig(cfg)).catch(() => {});
  }, []);

  return config;
}

/**
 * Call API to set current org (e.g. from workspaces switcher). Cookie is set by server.
 */
export function useSetCurrentOrg() {
  return useCallback(async (organizationId: string) => {
    const res = await fetch("/api/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    if (!res.ok) throw new Error("Failed to switch organization");
    window.location.href = "/dashboard"; // Navigate to dashboard with new org context
  }, []);
}
