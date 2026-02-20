# Sprint 1: Foundation Implementation Plan

Replicate the Finsera dashboard design pixel-for-pixel as the UI foundation for the AI Accounting SaaS, with full auth, Supabase backend, and design system.

---

## UI Reference: Finsera Dashboard (Screenshot)

### Top Navigation Bar
- **Left**: App logo + name
- **Center**: Icon-based module nav inside a pill/capsule container with frosted-glass bg. Icons: Home, Accounting (active = filled background), and other module icons. Active state has a subtle filled pill behind the icon.
- **Right**: User profile — name "Carlos Mendes" + role "Ops Manager" + circular avatar, followed by 3 small icon buttons (notification, settings, grid)

### Breadcrumbs
- Small text: "Workspaces / Sales" with folder icon prefix
- Positioned directly below top nav, above page title

### Page Header
- **Title**: "Accounting Command Center" — large (~32-36px), bold, dark
- **Right side**: Action icons (sparkle/AI, star/favorite, eye/view) + Share button with overlapping avatar stack (3 users) + green "Share" pill button

### Main Content Grid: 8 + 4 Columns

**Left card (8 col) — "Half-year income statement"**
- Card title: "Half-year income statement" (16px semibold)
- Subtitle: "Income growth to end the half-year" (12-13px, gray)
- Top-right card actions: folder, settings, expand icons
- **Hero metric**: "35.7%" — huge (~48-56px), bold, with small green ▲ arrow
- "Last update: 04.16.25 at 7:00 PM" (meta text, gray, small)
- **Legend**: colored dots — Income (red), COGS (red), New Profit (yellow), Expenses (black)
- **Chart**: Mixed bar+area chart, Jan-Aug. Green bars (positive), red bars (negative), thin line overlays. Tooltip on hover: "Income $30,538 This week" in a dark rounded tooltip.
- Y-axis: -50k to 150k. X-axis: month labels

**Right card (4 col) — "Insight"**
- Header: "Insight" with left/right carousel arrows (◀ ▶)
- **Bold insight text**: "The new feedback form **boosted requests and sales**" — larger text with keyword bolding
- **Pink/red area chart** below the text (soft gradient fill)
- **Two comparison metrics**: "$92,367 After 10:04" and "$46,846 Before 10:04"
- Small info (?) icon bottom-right

### Bottom Row: 6 + 6 Columns

**Left card — "Project budget forecast"**
- Title + subtitle: "Sales up 17% after website update"
- Card action icons (folder, settings, expand)
- **Hero metric**: "17%" — large bold
- Legend dots: Sales (green), Forecast (green lighter)
- **Bar chart**: green vertical bars, weekly data
- Sub-metric: green dot + "$12,279 This week"

**Right card — "Sales forecast"**
- Title + subtitle: "Sales are 26% higher than forecast"
- Card action icons
- **Hero metric**: "26%" — large bold
- Legend dots: Sales, Forecast
- Sub-metric: "$12,279 This week"

### Floating AI Assistant (center-bottom overlay)
- **Dark glass panel**: dark translucent background, rounded ~20px, backdrop-blur
- Header: "AI Assistant" label + expand icon (top-right)
- **Suggestion chips**: rounded pills with border, text + "+" icon:
  - "What is our gross margin %?"
  - "How can we improve our cash flow?"
  - "Why did gross margin change during the period?"
- **Input bar**: dark rounded bar with:
  - Left: green sparkle/AI icon
  - Placeholder: "Ask anything or search..."
  - Right: help (?) icon + grid (⊞) icon

### Visual Style (Exact)
- **Background**: Warm pastel gradient — pink/peach/orange/yellow hues at top-left, fading to soft white/neutral toward bottom-right. Multi-stop, low contrast, never distracting.
- **Cards**: Pure white bg, very subtle light gray border (~1px, #E8E8EA), soft shadow (large blur 40-60px, ~5% opacity black), border-radius 20-24px, padding 24px
- **Typography**: Humanist sans-serif (Plus Jakarta Sans), metrics 48-56px bold, card titles 16px semibold, body 14px, meta 12px gray
- **Colors**: Green (#22C55E) = positive/growth, Red/Pink (#EF4444 / soft pink area fills) = negative/alert, Near-black (#0F172A) = primary text, Cool gray (#94A3B8) = secondary text
- **Card action icons**: Small (20px), gray, grouped top-right of each card (folder, gear, expand-arrow)
- **Charts**: Thin grid lines, muted, semantic color only, no decorative elements

---

## Step 1: Project Scaffolding

```
npx create-next-app@latest accounting-ai --typescript --tailwind --eslint --app --src-dir
```

Dependencies:
- **UI**: `shadcn/ui`, `lucide-react`, `framer-motion`, `recharts`
- **DB**: `drizzle-orm`, `drizzle-kit`, `postgres`
- **Auth**: `@supabase/supabase-js`, `@supabase/ssr`
- **State**: `zustand`, `@tanstack/react-query`
- **Utils**: `clsx`, `tailwind-merge`, `date-fns`, `zod`

---

## Step 2: Design Tokens → Tailwind + CSS Variables

### Colors
```css
--canvas-gradient: linear-gradient(135deg, #FDE8E0 0%, #FAE0C8 15%, #FDF0D5 35%, #F5F0EA 60%, #F0F0F2 100%)
--surface: #FFFFFF
--surface-translucent: rgba(255,255,255,0.85)
--glass-dark: rgba(28,28,30,0.85)
--glass-border: rgba(255,255,255,0.1)
--text-primary: #0F172A
--text-secondary: #94A3B8
--text-meta: #A0A5B2
--success: #22C55E
--success-light: #DCFCE7
--error: #EF4444
--error-light: #FEE2E2
--accent-pink: #F87171
--accent-yellow: #FBBF24
--border-subtle: #E8E8EA
--border-card: #ECECEE
```

### Spacing (8pt)
xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64

### Radius
card=24px, pill=9999px, button=12px, input=12px

### Typography (Plus Jakarta Sans via next/font)
- Page title: 36px / 700
- Hero metric: 52px / 800 (with letter-spacing -0.02em)
- Card title: 16px / 600
- Body: 14px / 400
- Meta: 12px / 400

### Shadows
- card: `0 4px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)`
- overlay: `0 8px 60px rgba(0,0,0,0.15)`

---

## Step 3: Core Components (Finsera-Matched)

### Layout
| Component | Finsera Detail |
|-----------|---------------|
| `AppShell` | Full-screen gradient canvas + top nav + content area + floating AI layer |
| `TopNav` | Frosted pill center nav, logo left, profile right. Height ~60px. |
| `CenterNav` | Pill-shaped container with icon buttons, active = filled bg |
| `ProfileMenu` | Name + role text + avatar circle + icon buttons |
| `Breadcrumbs` | Small gray text with "/" separator, folder icon |
| `PageHeader` | Title left + action icons + share button right |
| `PageContainer` | max-w-[1440px], px-8 (32px side padding) |

### Cards
| Component | Finsera Detail |
|-----------|---------------|
| `DashboardCard` | White, 24px radius, 24px padding, subtle border, soft shadow, action icons top-right |
| `CardActions` | Row of 3 icons: folder, settings, expand (20px, gray) |
| `MetricCard` | Title + subtitle + hero metric + chart + legend |
| `InsightCard` | Carousel header + bold insight text + chart + comparison metrics |
| `GlassCard` | Dark translucent bg, backdrop-blur-xl, for AI panel |

### Data Display
| Component | Detail |
|-----------|--------|
| `HeroMetric` | 52px/800 weight number + optional % + trend arrow (▲/▼) |
| `TrendArrow` | Green ▲ or red ▼, small, next to metric |
| `LegendDots` | Row of colored dots + labels |
| `ChartTooltip` | Dark rounded tooltip: "Income $30,538 / This week" |
| `ComparisonMetric` | Label + dollar amount, side by side |

### Charts (Recharts, styled to match)
| Component | Detail |
|-----------|--------|
| `IncomeChart` | Mixed bar (green+red) + area/line overlay, muted grid |
| `AreaChart` | Soft gradient fill (pink for insight, green for forecast) |
| `BarChart` | Green vertical bars, rounded top |

### AI Assistant
| Component | Detail |
|-----------|--------|
| `AIAssistantPanel` | Dark glass, centered bottom, fixed position, ~500px wide |
| `SuggestionChip` | Rounded pill, border, text + "+" icon, hover highlight |
| `AIInputBar` | Dark rounded bar, green sparkle left, placeholder center, icons right |

### Overlays (Reusable Two-Panel Entity Pattern)
| Component | Detail |
|-----------|--------|
| `EntityPanel` | Radix Dialog root — compound component for add/edit any entity |
| `EntityPanelContent` | Centered overlay with rounded-3xl, shadow-overlay, size variants (md/lg/xl) |
| `EntityPanelBody` | Flex row wrapper for Main + Sidebar panels |
| `EntityPanelMain` | Left scrollable content area (avatar, field groups, links) |
| `EntityPanelSidebar` | Right 300px settings panel with border-l, muted bg |
| `EntityPanelHeader` | Title (uppercase tracking) + close X + optional AI sparkle button |
| `EntityPanelAvatar` | Gradient circle avatar + name + subtitle, centered |
| `EntityPanelFieldGroup` | Bordered rounded card with divide-y field rows |
| `EntityPanelFieldRow` | Horizontal divide-x row (e.g., First Name / Last Name side-by-side) |
| `EntityPanelField` | Icon circle + uppercase label + value text |
| `EntityPanelLink` | Green "+ Add something" link button |
| `EntityPanelSidebarHeader` | Back chevron + section title |
| `EntityPanelSidebarSection` | Labeled section with uppercase title |
| `EntityPanelFooter` | Full-width bottom bar with Cancel (ghost) + Save (green) |
| `EntityPanelAiHint` | Centered meta text for AI auto-fill hint |
| `EntityPanelInfoMessage` | Muted info box with icon |

**Usage**: Add Client, Add Vendor, Add Product, Edit Invoice, Add Employee — any entity CRUD overlay.

### Navigation Items (icon-only center nav, matching Finsera)
Home, Accounting (active), Sales, Purchases, Banking, Reports, Settings — as icon-only buttons inside a frosted pill

---

## Step 4: Supabase + Auth

### Setup
- Supabase project creation guide for user
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server + browser client helpers
- Middleware for route protection

### Auth Pages (styled to match brand — clean, minimal)
- `/login` — email/password
- `/signup` — registration + org creation
- `/onboarding` — org name, currency (AED default), fiscal year

### Foundation DB Schema (Drizzle)
```
organizations    (id, name, currency, fiscal_year_start, tax_registration_number, created_at)
users            (id, auth_id, email, full_name, role_title, avatar_url)
user_roles       (id, user_id, organization_id, role)
audit_logs       (id, organization_id, user_id, action, entity, entity_id, metadata, created_at)
```
+ RLS policies on all tables using `organization_id`

---

## Step 5: Dashboard Page (Finsera Clone)

Build the actual dashboard page with:
1. **PageHeader**: "Accounting Command Center" + action icons + share
2. **Row 1**: Income statement card (8col) + Insight card (4col)
3. **Row 2**: Budget forecast card (6col) + Sales forecast card (6col)
4. **Floating AI Assistant**: Centered bottom overlay

All cards populated with **realistic mock data** (UAE context: AED amounts, UAE-relevant labels).

---

## File Structure

```
/src
  /app
    /(auth)/login, /signup, /onboarding
    /(dashboard)
      /layout.tsx              ← AppShell
      /dashboard/page.tsx      ← Finsera-style dashboard
      /settings/page.tsx
    /layout.tsx                ← Root: font, providers
    /globals.css               ← Gradient bg, CSS vars, base
  /components
    /layout/   (app-shell, top-nav, center-nav, breadcrumbs, page-header, page-container)
    /cards/    (dashboard-card, card-actions, metric-card, insight-card)
    /charts/   (income-chart, area-chart, bar-chart, chart-tooltip)
    /ai/       (assistant-panel, suggestion-chip, ai-input-bar)
    /overlays/ (entity-panel compound component, entity-panel-demo)
    /data-display/ (hero-metric, trend-arrow, legend-dots, comparison-metric)
    /ui/       (shadcn primitives: button, input, avatar, badge, checkbox, radio-group, label, scroll-area, etc.)
    /feedback/ (toast, alert, dialog)
  /lib
    /supabase/ (client.ts, server.ts, middleware.ts)
    /db/       (schema.ts, index.ts)
    /utils.ts
  /hooks/   (use-auth, use-organization)
  /providers/ (theme, query, supabase)
```

---

## Sprint 1 Deliverables

1. **Next.js app** scaffolded with full Finsera design system
2. **Auth flow** (login/signup/onboarding)
3. **App shell** — top nav with frosted center nav, profile, breadcrumbs
4. **Dashboard page** — pixel-match of Finsera screenshot with mock data
5. **AI Assistant panel** — floating dark glass with suggestion chips + input
6. **Supabase** connected with RLS on foundation tables
7. **Dark/light mode** ready (CSS variables)
8. **All reusable components** built and consistent per design system
