"use client";

import { useCallback, useEffect, useState } from "react";

const CURRENT_ORG_COOKIE = "current_org_id";

/**
 * Client-side hook to read current org ID from document.cookie (for display).
 * For API calls, use server getCurrentOrganizationId() so cookie is in request.
 */
export function useCurrentOrgId(): string | null {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENT_ORG_COOKIE}=([^;]*)`));
    setOrgId(match ? decodeURIComponent(match[1]) : null);
  }, []);

  return orgId;
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
    window.location.reload(); // Reload so all data refetches with new org
  }, []);
}
