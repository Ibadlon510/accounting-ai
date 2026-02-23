---
consolidatedFrom:
  - UI Kit Structure.md
  - Brand & Design Guidelines.md
  - dashboard_ui_blueprint.md
  - sales_dashboard_modern_ui_f8f8aecf.plan.md
category: design
---

# Design System & Sales Dashboard

Consolidated from: UI Kit Structure, Brand & Design Guidelines, Dashboard UI Blueprint, Sales Dashboard Modern UI.

---

# Part I: Design System Foundation

## 1.1 Brand & Design Guidelines

Modern accounting workspace for UAE firms. Subscription model: simple, accessible, professional (≈ 49 AED / month). Design goal: calm, intelligent financial control.

### Brand Personality

**Core Traits:** Trustworthy, Precise, Calm, Intelligent, Efficient, Premium but accessible.

This product should feel like:
> "Your financial operations are under control."

**Emotional Outcome for Users:** Reduced stress, Clear overview, Confidence in numbers, Sense of control.

This is enterprise-grade clarity, not playful fintech energy.

### Color System

**Design Principle:** Color is used only when it communicates meaning.

| Role | Description | Usage |
|------|-------------|-------|
| App background | Soft pastel gradient | Canvas |
| Surface | White or translucent white | Cards |
| Positive | Soft green | Growth, success |
| Negative | Soft red | Loss, alerts |
| Primary text | Near-black | Main content |
| Secondary text | Cool gray | Metadata |

**Gradient Environment:** Subtle multi-stop gradients, low contrast, never distracting. Purpose: premium calm atmosphere.

### Typography System

**Font Characteristics:** Humanist sans-serif, high readability, neutral personality, optimized for numeric data.

**Recommended fonts:** Inter, SF Pro, Plus Jakarta Sans.

| Level | Purpose | Emotional Role |
|-------|---------|----------------|
| Page Title | Orientation | Calm authority |
| Large Metrics | Focus anchor | Confidence |
| Card Title | Structure | Professional |
| Body Text | Readability | Neutral |
| Meta Labels | Support | Quiet |

Numbers should always feel prominent.

### Layout Philosophy

**Core Principles:** Grid-based structure; Large breathing spaces; Cards as primary containers; Asymmetric visual balance; Data-first composition.

**Spatial Rhythm:** Structure → Data → Space → Insight → Action

This system supports clarity for accounting workflows.

### Surface & Elevation System

**Card Design Language:** Border radius 20–24px; Soft shadow; Light border; Clean surfaces; No heavy outlines.

**Depth Hierarchy:** 1. Canvas background → 2. Card surfaces → 3. Floating AI assistant

Layering communicates importance without visual noise.

### AI Experience Identity

AI is a core differentiator (especially for automation like SMS classification).

**Personality:** Helpful, not dominant; Embedded, not separate; Quietly intelligent.

**Visual Treatment:** Glass surface; Soft glow accent; Floating placement; Conversational suggestion chips.

User perception: *"The system understands my finances."*

### Data Visualization Style

**Chart Philosophy:** Clean over decorative; Thin lines; Muted grid; Semantic color only.

**Visual Priority:** 1. Metric → 2. Trend → 3. Context

Accountants want fast insight, not visual complexity.

### Interaction Design Principles

**Motion Behavior:** Subtle, fast, purpose-driven, no playful animations.

**Feedback System:** Hover → soft highlight; Click → immediate response; State change → smooth transition.

Goal: reliability and precision.

### Product Identity Strategy

The design must communicate: Professional quality, Reliability, Ease of use, Smart automation.

This visual identity supports: Solo-built credibility, Subscription trust, Enterprise readiness, Future mobile expansion.

Core perception: *"Clean, intelligent accounting software."*

### Consistency Rules

Never break these rules:
- Same card padding everywhere
- Same border radius everywhere
- Same spacing scale everywhere
- Same color semantics everywhere
- Same typography hierarchy everywhere

Consistency creates perceived maturity.

### Scalability Strategy

This design system supports future growth: Mobile applications, Payroll module, SMS classification features, Advanced analytics, Enterprise clients.

The system is modular by design.

---

## 1.2 UI Kit Structure

**Purpose:** Scalable component system for accounting SaaS dashboard.  
**Design Principles:** Calm, precise, structured, enterprise-grade clarity.

### Foundations — Design Tokens

**Colors:** color.background.canvas, color.background.surface, color.background.glass, color.text.primary, color.text.secondary, color.semantic.success, color.semantic.error, color.border.subtle, color.accent.primary

**Spacing:** space.1→4px, space.2→8px, space.3→16px, space.4→24px, space.5→32px, space.6→48px, space.7→64px

**Radius:** radius.sm→12px, radius.md→20px, radius.lg→24px

**Shadow:** shadow.card, shadow.overlay, shadow.focus

**Typography:** font.family.primary, font.size.display, font.size.metric, font.size.title, font.size.body, font.size.meta

### Layout Components

**App Shell:** AppContainer, PageContainer, SectionContainer, Grid12, Stack, Inline

**Navigation:** TopNav, Breadcrumbs, WorkspaceSwitcher, ProfileMenu, ActionBar

### Surface Components

**Card System:** Card, CardHeader, CardBody, CardFooter, GlassCard, MetricCard, InsightCard

**Elevation Layers:** SurfaceBase, SurfaceRaised, SurfaceFloating

### Data Display Components

**Metrics:** MetricDisplay, KPIIndicator, TrendBadge, StatusDot

**Tables:** DataTable, TableHeader, TableRow, TableCell, EmptyState

**Charts:** LineChart, BarChart, ForecastChart, ChartContainer, ChartLegend

### Input Components

**Form Controls:** TextInput, SearchInput, NumberInput, Select, MultiSelect, DatePicker

**Actions:** PrimaryButton, SecondaryButton, GhostButton, IconButton, ToggleSwitch

### AI Assistant Components

AssistantPanel, AssistantInputBar, SuggestionChip, MessageBubble, ActionShortcut, AiAvatar (xs/sm/md/lg/xl/2xl sizes, ring + glow variants), AiAvatarAnimated (pulse glow for loading/thinking states)

**Design Rule:** AI elements use glass surface and floating elevation. AI character avatar appears in: panel header, input bar, chat bubbles, onboarding, error states.

### Feedback & Status

**Indicators:** Badge, NotificationDot, ProgressBar, LoadingSpinner

**System Feedback:** Toast, Alert, InlineMessage, ConfirmationDialog

### Identity Components

**User:** Avatar, AvatarStack, UserLabel

**Organization:** WorkspaceTag, RoleBadge

### Interaction Patterns

**Overlays:** Dropdown, Popover, Modal, SlidePanel, EntityPanel (two-panel overlay: main content + settings sidebar)

**Navigation:** Tabs, SegmentedControl, Pagination

### Composition Patterns

**Dashboard:** AnalyticsHeroPanel, SideInsightPanel, DualMetricRow, ForecastSection, FloatingAssistantLayout

**Entity Management:** EntityPanel, EntityPanelBody, EntityPanelMain, EntityPanelSidebar, EntityPanelFieldGroup, EntityPanelFooter

**Content:** SectionHeader, FilterBar, ActionToolbar

### Naming Convention

Category → Component → Variant

Examples: Card / Metric / Default; Button / Primary / Default; Input / Search / WithIcon; Chart / Line / Revenue

### AI Character Assets

Directory: `/public/assets/ai-character/`

| Asset | File | Purpose |
|-------|------|---------|
| Default avatar | avatar.png | Primary circular avatar (512×512 transparent PNG) |
| Placeholder | avatar-placeholder.svg | SVG fallback |
| Thinking | avatar-thinking.png | Loading/processing states |
| Happy | avatar-happy.png | Success confirmations |
| Sorry | avatar-sorry.png | Error/apologetic states |
| Hero | hero.png | Onboarding & landing (1024×1400 transparent PNG) |

**Design Rule:** Character uses brand green (#22C55E) accent (tie, eyes). Style: clean modern anime, professional suit, warm pastel palette.

### File Structure

```
/components
  /layout
  /navigation
  /surfaces
  /data-display
  /inputs
  /ai
  /feedback
  /identity
  /overlays
  /patterns
```

### Usage Principles

- Always compose from primitives
- Never create one-off components
- Use spacing tokens only
- Use semantic colors only
- Maintain consistent elevation hierarchy

---

## 1.3 Dashboard UI Blueprint

**Purpose:** Reverse-engineered frontend architecture for a modern SaaS analytics dashboard.

### Layout Architecture

**App Shell Structure:** Top Navigation Bar; Main Content Grid (12-column system); Floating AI Assistant Layer

**Grid System:** Max width 1280–1440px; Side padding 32px; Columns 12; Column gap 24px

**Layout Rows:** 1. Header → 2. Primary Analytics Panel (8 columns) → 3. Insight Side Panel (4 columns) → 4. Secondary Analytics Row (6 + 6) → 5. Floating Assistant Overlay

### Component Checklist

**Layout:** AppShell, TopNav, Sidebar (collapsed), Breadcrumbs, ProfileActions

**Data:** MetricCard, ChartCard, InsightCard, ForecastCard, KPIIndicator

**AI:** AssistantPanel, SuggestionChips, InputBar

**Primitives:** Card, Button, IconButton, AvatarStack, Badge, Divider

### Spacing & Sizing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | micro spacing |
| sm | 8px | icon padding |
| md | 16px | standard padding |
| lg | 24px | card padding |
| xl | 32px | section spacing |
| 2xl | 48px | major separation |
| 3xl | 64px | hero spacing |

**Card Anatomy:** Border radius 20–24px; Padding 24px; Internal gap 16px; Shadow: large blur, low opacity

**Typography Scale:** Page Title 32–36px; Primary Metric 40–56px; Card Title 16px; Body 14px; Meta 12px

**Icon System:** Icon size 20px; Action button container 36–40px

### Visual Design System

**Background:** Soft pastel gradient; Low contrast environment

**Cards:** Light border; Elevated shadow; Glass effect on overlays

**Color Semantics:** Green → positive; Red → negative; Neutral → structure

**Visual Rhythm:** Dense → Space → Dense → Space

### Frontend Architecture

**Stack:** React + Next.js, TailwindCSS, Recharts or Chart.js, Framer Motion

**Folder Structure:** /layout (AppShell, TopNav), /cards (MetricCard, ChartCard, InsightCard), /charts (IncomeChart, ForecastChart), /ai (AssistantPanel), /ui (Button, Card, AvatarStack, Badge)

### Professional Design Workflow

1. Wireframe layout (structure and card placement)
2. Define spacing tokens (lock before styling)
3. Build card system (reusable container)
4. Apply typography hierarchy
5. Integrate data visualization
6. Apply gradient environment
7. Add floating assistant layer

### Hidden UX Principles

- **Asymmetrical Balance:** Primary panel heavier than side panel
- **Visual Anchors:** Large metrics guide attention first
- **Interaction Density Gradient:** Navigation → Insight → Interaction
- **Micro-Contrast Strategy:** Contrast through spacing and size, not color

### Implementation Roadmap

1. Create 12-column layout container
2. Build reusable Card component
3. Implement typography scale
4. Integrate chart components
5. Add gradient background
6. Implement AI assistant overlay

---

## 1.4 Token Consolidation (Reference)

Single reference merging colors, spacing, radius, typography from Brand, UI Kit, and Blueprint.

| Category | Token | Value | Alias |
|----------|-------|-------|-------|
| Spacing | space.1 / xs | 4px | — |
| Spacing | space.2 / sm | 8px | — |
| Spacing | space.3 / md | 16px | — |
| Spacing | space.4 / lg | 24px | — |
| Spacing | space.5 / xl | 32px | — |
| Spacing | space.6 / 2xl | 48px | — |
| Spacing | space.7 / 3xl | 64px | — |
| Radius | radius.sm | 12px | button, input |
| Radius | radius.md | 20px | — |
| Radius | radius.lg | 24px | card |
| Typography | Page Title | 32–36px | — |
| Typography | Hero/Metric | 40–56px | — |
| Typography | Card Title | 16px | — |
| Typography | Body | 14px | — |
| Typography | Meta | 12px | — |
| Color | Positive | #22C55E | --success |
| Color | Negative | #EF4444 | --error |
| Color | Primary text | #0F172A | --text-primary |
| Color | Secondary text | #94A3B8 | --text-secondary |
| Color | Border | #E8E8EA | --border-subtle |

---

# Part II: Sales Dashboard Modern UI

## Current Issues

- Summary cards: functional but plain; icon treatment is basic
- Dashboard widgets: no card containers; raw content floats in grid
- Charts: small height (120-140px), no CartesianGrid, no custom tooltips, hardcoded hex colors
- Metrics (avg, collection rate, YoY): plain text divs with no elevation or hierarchy
- Tables (top customers, products): flat lists, no row styling or hover states
- Loading: plain text "Loading..."; no skeleton
- Section header: bare border-b; lacks polish

## Design Direction

Align with existing patterns in `income-chart.tsx` and `globals.css`: use `dashboard-card`, `glass-dark`, CSS variables (`--success`, `--chart-1`, `--border-subtle`, `--text-meta`), refined axis/tooltip styling, and consistent spacing.

---

## 1. Summary Cards (Sales Page)

**File:** `src/app/(dashboard)/sales/page.tsx`

- Add subtle left accent border per card (e.g., 3px solid using card color: success for Revenue, accent-yellow for Outstanding, error for Overdue, primary for Customers)
- Improve icon containers: slightly larger (h-11 w-11), use `bg-success/10`, `bg-accent-yellow/10`, etc. for color-matched backgrounds
- Add hover scale or lift (`transition-transform hover:-translate-y-0.5`) for micro-interaction
- Ensure responsive grid: `col-span-6 md:col-span-3` for mobile

---

## 2. Dashboard Section Header

**File:** `src/app/(dashboard)/sales/page.tsx`

- Replace plain `border-b` with a softer separation: `pb-4 mb-6` and a subtle `bg-muted/30` pill or badge behind the title
- Style Customize button as outline/secondary with icon; match existing button variants

---

## 3. Widget Card Wrapper

**File:** `src/components/dashboard/dashboard-widget.tsx`

- When `layout="page"` (passed via context or prop), wrap children in `dashboard-card` with `p-5`
- Add optional `variant` prop: `"default" | "compact"` — compact for popover (no card), default for page (card)

**Preferred approach:** In `sales-dashboard.tsx`, when `layout="page"`, pass `className={cn(metricsSpanClass, "dashboard-card p-5")}` to each `DashboardWidget`. The `DashboardWidget` already accepts `className`; merge it with the card styling.

---

## 4. SalesDashboard Widget Styling

**File:** `src/components/dashboard/variants/sales-dashboard.tsx`

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

**File:** `src/app/(dashboard)/sales/page.tsx`

- Replace "Loading dashboard..." with a grid of `SkeletonCard` components (e.g., 6 cards) matching the widget grid
- Error: use a card with `text-destructive` and optional retry button

**File:** `src/components/ui/skeleton-card.tsx` — Already exists; import and use. May add a `SkeletonChart` variant (rectangular placeholder) if needed.

---

## 6. Customize Panel

**File:** `src/app/(dashboard)/sales/page.tsx`

- Style the customize container: `dashboard-card` or `rounded-xl border border-border-subtle bg-surface`
- Ensure `DashboardCustomizePanel` has consistent spacing

---

## 7. Color and Theme Consistency

- Replace hardcoded hex (`#22C55E`, `#3B82F6`, etc.) with CSS variables:
  - Revenue/success: `var(--chart-1)` or `var(--success)`
  - Blue: `var(--chart-4)` or `var(--accent-ai)`
  - Error: `var(--chart-2)` or `var(--destructive)`
- Recharts `fill` accepts `var(--xyz)` or pass `hsl(var(--success))` if needed; fallback to resolved value in JS if Recharts does not support CSS vars in all props

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
| `src/app/(dashboard)/sales/page.tsx` | Summary card styling (accent border, icon bg, hover); section header; loading skeletons; error card |
| `src/components/dashboard/variants/sales-dashboard.tsx` | Card wrappers for page layout; chart refinements (CartesianGrid, tooltips, axis, height); table row styling; small metrics layout; CSS variables |
| `src/components/dashboard/dashboard-widget.tsx` | Optional: support card wrapper via prop; or handle entirely in sales-dashboard |

---

## Implementation Order

1. Add card wrappers and base styling for page layout in `sales-dashboard.tsx`
2. Refine summary cards in `sales/page.tsx`
3. Upgrade charts (bar, line, pie, scatter) with grid, tooltips, axis styling
4. Style tables (top customers, top products) with rows and empty states
5. Restyle metrics row and small metrics
6. Add loading skeletons and error state in `sales/page.tsx`
7. Polish section header and customize panel
