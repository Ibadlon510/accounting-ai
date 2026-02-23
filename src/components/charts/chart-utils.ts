/**
 * Shared chart configuration and utilities for Recharts.
 * Centralizes axis styling, color resolution, and formatters
 * so every chart in the app looks consistent.
 */

// ── Axis config (reuse on every XAxis / YAxis) ──────────────────────
export const axisProps = {
  axisLine: false,
  tickLine: false,
} as const;

export const xAxisTickStyle = {
  fill: "var(--text-meta)",
  fontSize: 12,
} as const;

export const yAxisTickStyle = {
  fill: "var(--text-meta)",
  fontSize: 11,
} as const;

// ── CartesianGrid defaults ───────────────────────────────────────────
export const gridProps = {
  strokeDasharray: "none" as const,
  stroke: "var(--border-subtle)",
  strokeOpacity: 0.5,
  vertical: false,
} as const;

// ── Currency formatter (AED) ─────────────────────────────────────────
export function formatCurrency(value: number): string {
  return `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toFixed(0);
}

// ── Date formatter ───────────────────────────────────────────────────
export function formatShortDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-AE", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

// ── CSS variable color map (for Recharts Cell fills) ─────────────────
// Recharts <Cell fill={}> needs a resolved hex, not var().
// We resolve once on the client then cache.
const colorCache = new Map<string, string>();

export function resolveVar(cssVar: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const cached = colorCache.get(cssVar);
  if (cached) return cached;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  const value = resolved || fallback;
  colorCache.set(cssVar, value);
  return value;
}

// Pre-defined semantic chart colors (resolved at render time)
export function chartColors() {
  return {
    success: resolveVar("--success", "#22C55E"),
    error: resolveVar("--error", "#EF4444"),
    warning: resolveVar("--accent-yellow", "#FBBF24"),
    ai: resolveVar("--accent-ai", "#3B82F6"),
    purple: resolveVar("--chart-5", "#8B5CF6"),
    chart1: resolveVar("--chart-1", "#22C55E"),
    chart2: resolveVar("--chart-2", "#EF4444"),
    chart3: resolveVar("--chart-3", "#FBBF24"),
    chart4: resolveVar("--chart-4", "#3B82F6"),
    chart5: resolveVar("--chart-5", "#8B5CF6"),
  };
}
