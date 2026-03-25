"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title for client-side dashboard pages.
 * Uses the template: "{title} | Agar Smart Accounting"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const suffix = "Agar Smart Accounting";
    document.title = title ? `${title} | ${suffix}` : suffix;
  }, [title]);
}
