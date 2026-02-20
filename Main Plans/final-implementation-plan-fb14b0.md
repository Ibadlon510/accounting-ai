# AI Accounting SaaS — Final Implementation Plan

Complete implementation plan for a UAE-focused AI accounting SaaS: Finsera-inspired UI, Next.js full-stack on Vercel + Supabase, 9-sprint MVP (~20 weeks).

---

## 1. Technical Decisions

| Decision | Choice |
|----------|--------|
| Stack | Next.js 14+ App Router, TypeScript |
| UI | Tailwind CSS + shadcn/ui + Recharts + Framer Motion |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Supabase Auth (email/password, MFA-ready) |
| State | Zustand + TanStack Query |
| Files | Supabase Storage |
| PDF | @react-pdf/renderer |
| Email | Resend |
| Hosting | Vercel + Supabase |
| AI (entry) | OpenAI GPT-4o-mini (structured outputs) |
| AI (classify) | Rule-based TS engine + per-org learning |
| Multi-tenancy | Shared DB + Row-Level Security |
| Payments | Stripe (post-MVP) |
| Repo | Single Next.js app |

---

## 2. Architecture

### Accounting Engine
- Immutable `journal_entries` + `journal_lines` (append-only, never update/delete)
- Every business event → journal entries (single source of truth)
- Double-entry enforced at DB level: CHECK(sum debits = sum credits)
- Period locking via `accounting_periods.is_locked`
- Ledger balances derived from journal lines + cached materialized view

### Multi-Tenancy
- `organization_id` on every table
- Supabase RLS policies enforce data isolation at DB level

### AI Hybrid
- **Smart entry bar**: GPT-4o-mini parses natural language → structured transaction
- **Bank classification**: Rule-based pattern matching + correction learning
- **Per-org learning**: `classification_rules` table stores user overrides

---

## 3. Database Schema

```
-- Foundation
organizations, users, user_roles, audit_logs

-- Accounting
chart_of_accounts, account_types, accounting_periods, fiscal_years
journal_entries, journal_lines

-- Sales & Purchases
customers, suppliers
invoices, invoice_lines
bills, bill_lines
payments, payment_allocations

-- Inventory
items, inventory_movements

-- Banking
bank_accounts, bank_transactions, bank_reconciliations

-- VAT
tax_codes, vat_returns, vat_return_lines

-- Multi-currency
currencies, exchange_rates

-- AI
classification_rules

-- Payroll (foundation)
employees, salary_records
```

---

## 4. UI Design System (Finsera Reference)

### Visual Style
- **Background**: Warm pastel gradient (pink/peach/yellow → neutral white)
- **Cards**: White, 24px radius, 24px padding, 1px #E8E8EA border, soft shadow
- **Font**: Plus Jakarta Sans — metrics 52px/800, titles 16px/600, body 14px, meta 12px
- **Colors**: Green #22C55E (positive), Red #EF4444 (negative), Text #0F172A, Secondary #94A3B8
- **AI Panel**: Dark glass (rgba(28,28,30,0.85)), backdrop-blur, floating

### CSS Variables
```css
--canvas-gradient: linear-gradient(135deg, #FDE8E0 0%, #FAE0C8 15%, #FDF0D5 35%, #F5F0EA 60%, #F0F0F2 100%)
--surface: #FFFFFF
--glass-dark: rgba(28,28,30,0.85)
--text-primary: #0F172A
--text-secondary: #94A3B8
--success: #22C55E
--error: #EF4444
--border-subtle: #E8E8EA
--shadow-card: 0 4px 40px rgba(0,0,0,0.04)
--shadow-overlay: 0 8px 60px rgba(0,0,0,0.15)
```

### Spacing (8pt): 4, 8, 16, 24, 32, 48, 64
### Radius: card=24px, pill=9999px, button=12px

---

## 5. Component Architecture

### Layout
| Component | Detail |
|-----------|--------|
| `AppShell` | Gradient canvas + top nav + content + floating AI |
| `TopNav` | Logo left, frosted pill center nav (icon-only modules), profile right |
| `CenterNav` | Pill container, icon buttons, active = filled bg |
| `Breadcrumbs` | "Workspaces / Module" with folder icon |
| `PageHeader` | Title + action icons + share button with avatar stack |
| `PageContainer` | max-w-1440px, px-8 |

### Cards
| Component | Detail |
|-----------|--------|
| `DashboardCard` | White, 24px radius/padding, border, shadow, action icons |
| `CardActions` | Folder + settings + expand icons (20px, gray) |
| `MetricCard` | Title + subtitle + hero metric + chart + legend |
| `InsightCard` | Carousel header + bold text + chart + comparison metrics |
| `GlassCard` | Dark translucent, backdrop-blur-xl |

### Data Display
`HeroMetric` (52px bold + trend arrow), `TrendArrow`, `LegendDots`, `ComparisonMetric`, `DataTable`, `EmptyState`

### Charts (Recharts)
`IncomeChart` (bar+area mix), `AreaChart` (gradient fill), `BarChart` (green bars, rounded)

### AI Assistant
`AIAssistantPanel` (dark glass, fixed bottom-center), `SuggestionChip` (pill + "+" icon), `AIInputBar` (sparkle icon + placeholder + help/grid icons)

### Navigation Icons (center nav)
Home, Accounting, Sales, Purchases, Banking, Reports, VAT, Settings

---

## 6. File Structure

```
/src
  /app
    /(auth)
      /login/page.tsx
      /signup/page.tsx
      /onboarding/page.tsx
      layout.tsx
    /(dashboard)
      layout.tsx                ← AppShell
      /dashboard/page.tsx       ← Finsera-style dashboard
      /settings/page.tsx
      /accounting/page.tsx      ← Sprint 2+
      /sales/page.tsx           ← Sprint 3+
      /purchases/page.tsx       ← Sprint 4+
      /inventory/page.tsx       ← Sprint 5+
      /banking/page.tsx         ← Sprint 6+
      /vat/page.tsx             ← Sprint 7+
      /reports/page.tsx         ← Sprint 8+
    layout.tsx                  ← Root: fonts, providers
    globals.css
  /components
    /layout/    app-shell, top-nav, center-nav, breadcrumbs, page-header, page-container
    /cards/     dashboard-card, card-actions, metric-card, insight-card
    /charts/    income-chart, area-chart, bar-chart, chart-tooltip
    /ai/        assistant-panel, suggestion-chip, ai-input-bar
    /data-display/  hero-metric, trend-arrow, legend-dots, data-table, empty-state
    /ui/        shadcn primitives (button, input, avatar, badge, dialog, etc.)
    /feedback/  toast, alert, confirmation-dialog
  /lib
    /supabase/  client.ts, server.ts, middleware.ts
    /db/        schema.ts, index.ts, migrations/
    /accounting/ engine.ts, journal.ts, ledger.ts, trial-balance.ts
    /ai/        classifier.ts, nl-parser.ts, rules-engine.ts
    /vat/       calculator.ts, return-builder.ts
    utils.ts
  /hooks/       use-auth, use-organization, use-journal
  /providers/   theme-provider, query-provider, supabase-provider
  /types/       accounting.ts, organization.ts, invoice.ts
```

---

## 7. Sprint Roadmap

### Sprint 1: Foundation (Week 1–2) ← START HERE
1. `npx create-next-app` + install all deps
2. Tailwind config with Finsera design tokens
3. `globals.css` with CSS variables + gradient background
4. Supabase client setup (browser + server + middleware)
5. Foundation DB schema (organizations, users, user_roles, audit_logs) + RLS
6. Auth pages: `/login`, `/signup`, `/onboarding`
7. `AppShell` with `TopNav` (frosted center nav + profile)
8. `Breadcrumbs` + `PageHeader` + `PageContainer`
9. All card components: `DashboardCard`, `MetricCard`, `InsightCard`, `GlassCard`
10. `HeroMetric`, `TrendArrow`, `LegendDots`, `ComparisonMetric`
11. Chart components: `IncomeChart`, `AreaChart`, `BarChart`
12. `AIAssistantPanel` + `SuggestionChip` + `AIInputBar`
13. Dashboard page — full Finsera clone with UAE mock data (AED)
14. Dark/light mode via CSS variables
15. Organization settings page

### Sprint 2: Accounting Core (Week 3–5)
- Chart of Accounts (UAE template seeded)
- Double-entry journal posting engine
- General Ledger view
- Trial Balance report
- Period management (open/close/lock)
- Audit trail logging

### Sprint 3: Sales + VAT (Week 6–8)
- Customer management
- Sales invoice creation (inline editing, auto-VAT)
- Multi-currency support + exchange rates
- Payment recording + allocation
- Invoice PDF generation
- Customer statements
- Output VAT tracking

### Sprint 4: Purchases (Week 9–10)
- Supplier management
- Bills entry + expense recording
- Input VAT tracking
- Supplier payment recording

### Sprint 5: Simple Inventory (Week 11–12)
- Item master list
- Quantity + cost tracking (weighted average)
- Auto COGS journal posting on sale
- Stock increase on purchase
- Inventory valuation report

### Sprint 6: Banking (Week 13–14)
- Bank account management
- CSV import + parsing
- Reconciliation interface
- Rule-based AI matching suggestions
- Transfer between accounts

### Sprint 7: VAT Module (Week 15)
- VAT summary report
- VAT return preparation
- Reverse charge handling
- VAT audit report

### Sprint 8: AI + Reports + Polish (Week 16–18)
- Transaction classification engine
- Smart account suggestions
- OpenAI natural language entry bar
- Duplicate detection + anomaly alerts
- P&L, Balance Sheet reports
- Dashboard wired to real data
- Payroll foundation (employee records, salary posting)

### Sprint 9: Launch Prep (Week 19–20)
- Onboarding flow polish
- Landing page
- Error handling + edge cases
- Performance optimization
- Security hardening
- Deploy to Vercel

---

## 8. Deferred (Phase 2+)
Stripe billing, FIFO costing, Arabic UI, OCR scanning, bank feeds API, approval workflows, FTA VAT format, accountant dashboard, full payroll/WPS, multi-warehouse, global tax engine
