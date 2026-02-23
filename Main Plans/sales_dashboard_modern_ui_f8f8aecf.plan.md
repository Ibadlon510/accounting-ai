---
name: Sales Dashboard Modern UI
overview: Redesign the Sales dashboard page and widgets to have a modern, polished UI by adding card containers, refined chart styling, better typography, loading skeletons, and consistent visual hierarchy using the existing design system (Finsera palette, dashboard-card, glass-dark, chart styles).
todos: []
isProject: false
---

# Sales Dashboard Modern UI Redesign

## Current Issues

- Summary cards: functional but plain; icon treatment is basic
- Dashboard widgets: no card containers; raw content floats in grid
- Charts: small height (120-140px), no CartesianGrid, no custom tooltips, hardcoded hex colors
- Metrics (avg, collection rate, YoY): plain text divs with no elevation or hierarchy
- Tables (top customers, products): flat lists, no row styling or hover states
- Loading: plain text "Loading..."; no skeleton
- Section header: bare border-b; lacks polish

## Design Direction

Align with existing patterns in [income-chart.tsx](src/components/charts/income-chart.tsx) and [globals.css](src/app/globals.css): use `dashboard-card`, `glass-dark`, CSS variables (`--success`, `--chart-1`, `--border-subtle`, `--text-meta`), refined axis/tooltip styling, and consistent spacing.

---

## 1. Summary Cards (Sales Page)

**File:** [src/app/(dashboard)/sales/page.tsx](src/app/(dashboard)/sales/page.tsx)

- Add subtle left accent border per card (e.g., 3px solid using card color: success for Revenue, accent-yellow for Outstanding, error for Overdue, primary for Customers)
- Improve icon containers: slightly larger (h-11 w-11), use `bg-success/10`, `bg-accent-yellow/10`, etc. for color-matched backgrounds
- Add hover scale or lift (`transition-transform hover:-translate-y-0.5`) for micro-interaction
- Ensure responsive grid: `col-span-6 md:col-span-3` for mobile

---

## 2. Dashboard Section Header

**File:** [src/app/(dashboard)/sales/page.tsx](src/app/(dashboard)/sales/page.tsx)

- Replace plain `border-b` with a softer separation: `pb-4 mb-6` and a subtle `bg-muted/30` pill or badge behind the title
- Style Customize button as outline/secondary with icon; match existing button variants

---

## 3. Widget Card Wrapper

**File:** [src/components/dashboard/dashboard-widget.tsx](src/components/dashboard/dashboard-widget.tsx)

- When `layout="page"` (passed via context or prop), wrap children in `dashboard-card` with `p-5`
- Add optional `variant` prop: `"default" | "compact"` — compact for popover (no card), default for page (card)
- For page layout, the parent (`SalesDashboard`) passes layout; we can add a `DashboardWidgetCard` wrapper used only in page mode, or extend `DashboardWidget` to accept `elevated?: boolean` and apply `dashboard-card` when true
- Simpler approach: in `SalesDashboard` when `layout="page"`, wrap each `DashboardWidget` output in a `div` with `dashboard-card p-5` — but `DashboardWidget` returns null when not visible, so we need the card to be inside the conditional. Better: add `className` to wrap with card when `layout="page"` — pass `className="dashboard-card p-5"` from `SalesDashboard` for page layout widgets

**Preferred approach:** In [sales-dashboard.tsx](src/components/dashboard/variants/sales-dashboard.tsx), when `layout="page"`, pass `className={cn(metricsSpanClass, "dashboard-card p-5")}` to each `DashboardWidget`. The `DashboardWidget` already accepts `className`; we just need to merge it with the card styling. So we add `dashboard-card p-5` to the base className for page layout widgets.

---

## 4. SalesDashboard Widget Styling

**File:** [src/components/dashboard/variants/sales-dashboard.tsx](src/components/dashboard/variants/sales-dashboard.tsx)

### 4a. Base card class for page layout

- When `isPage`, use `widgetCardClass = "dashboard-card p-5"` and pass `className={cn(widgetCardClass, metricsSpanClass)}` to `DashboardWidget` for widgets that need it
- For metricsRow, use full span + card
- For small metrics (avgInvoiceValue, collectionRate, yoyGrowth): place in a single row of 3 compact stat cards when in page layout

### 4b. Metrics row (Revenue, Outstanding, Overdue, Invoices)

- Style as 4 stat cells inside one card with dividers: `border-r border-border-subtle last:border-r-0` between items
- Slightly larger value typography: `text-base` or `text-lg` for values

### 4c. Small metrics (avg, collection, YoY)

- In page layout: render in one row of 3 mini cards, each with icon + label + value
- Use `TrendingUp`, `Percent`, `BarChart2` from lucide for visual interest
- Subtle `bg-muted/30` or similar for each mini card if not using full dashboard-card

### 4d. Bar chart

- Height: 180px for page layout (140px for popover)
- Add `CartesianGrid` with `stroke="var(--border-subtle)"` and `vertical={false}`
- `axisLine={false}` and `tickLine={false}` on XAxis/YAxis
- Tick styling: `fill: "var(--text-meta)"`, `fontSize: 12`
- Custom `Tooltip` with `glass-dark rounded-xl px-3 py-2` and formatted currency
- Use `var(--chart-1)` or `var(--success)` for bar fill
- `radius={[4, 4, 0, 0]}` and `maxBarSize={24}`

### 4e. Line chart (revenue trend)

- Height: 160px for page
- Same axis/tooltip refinements
- Add `Area` with gradient fill for a modern look, or keep `Line` with `strokeWidth={2}` and `dot={false}`
- Use `var(--chart-1)` for stroke

### 4f. Pie chart

- Height: 180px for page
- Outer radius: 60 for page (50 for popover)
- Custom `Tooltip` with glass-dark
- Ensure `statusBreakdown` maps to theme colors via `var(--chart-1)` etc. or keep COLORS but ensure contrast

### 4g. Scatter chart

- Same tooltip and axis polish
- Use `var(--chart-4)` for scatter fill

### 4h. Top customers / Top products tables

- Add card container (already via DashboardWidget when we add it)
- Row styling: `py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0`
- Hover: `hover:bg-muted/40`
- First column (name): `font-medium text-text-primary`; second (value): `text-success` or `text-text-secondary`
- Add rank indicator (1, 2, 3...) or subtle avatar placeholder for top customers
- Empty state: centered `text-muted-foreground text-sm py-6`

---

## 5. Loading and Error States

**File:** [src/app/(dashboard)/sales/page.tsx](src/app/(dashboard)/sales/page.tsx)

- Replace "Loading dashboard..." with a grid of `SkeletonCard` components (e.g., 6 cards) matching the widget grid
- Error: use a card with `text-destructive` and optional retry button

**File:** [src/components/ui/skeleton-card.tsx](src/components/ui/skeleton-card.tsx)

- Already exists; import and use. May add a `SkeletonChart` variant (rectangular placeholder) if needed, or reuse `SkeletonCard` with different aspect ratio

---

## 6. Customize Panel

**File:** [src/app/(dashboard)/sales/page.tsx](src/app/(dashboard)/sales/page.tsx)

- Style the customize container: `dashboard-card` or `rounded-xl border border-border-subtle bg-surface`
- Ensure `DashboardCustomizePanel` has consistent spacing

---

## 7. Color and Theme Consistency

- Replace hardcoded hex (`#22C55E`, `#3B82F6`, etc.) with CSS variables:
  - Revenue/success: `var(--chart-1)` or `var(--success)`
  - Blue: `var(--chart-4)` or `var(--accent-ai)`
  - Error: `var(--chart-2)` or `var(--destructive)`
- Recharts `fill` accepts `var(--xyz)` or we can pass `hsl(var(--success))` if needed; fallback to a resolved value in JS if Recharts does not support CSS vars in all props

---

## 8. Responsive Behavior

- Summary cards: `grid-cols-2 md:grid-cols-4` (2 cols on mobile)
- Dashboard grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (already in place)
- Charts: full width in single column on mobile
- metricsRow: stack on very small screens or keep horizontal scroll if needed

---

## File Summary

| File | Changes |
|------|---------|
| [src/app/(dashboard)/sales/page.tsx](src/app/(dashboard)/sales/page.tsx) | Summary card styling (accent border, icon bg, hover); section header; loading skeletons; error card |
| [src/components/dashboard/variants/sales-dashboard.tsx](src/components/dashboard/variants/sales-dashboard.tsx) | Card wrappers for page layout; chart refinements (CartesianGrid, tooltips, axis, height); table row styling; small metrics layout; CSS variables |
| [src/components/dashboard/dashboard-widget.tsx](src/components/dashboard/dashboard-widget.tsx) | Optional: support card wrapper via prop; or handle entirely in sales-dashboard |

---

## Implementation Order

1. Add card wrappers and base styling for page layout in `sales-dashboard.tsx`
2. Refine summary cards in `sales/page.tsx`
3. Upgrade charts (bar, line, pie, scatter) with grid, tooltips, axis styling
4. Style tables (top customers, top products) with rows and empty states
5. Restyle metrics row and small metrics
6. Add loading skeletons and error state in `sales/page.tsx`
7. Polish section header and customize panel
