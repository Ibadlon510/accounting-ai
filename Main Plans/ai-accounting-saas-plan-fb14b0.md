# AI Accounting SaaS — Technical Implementation Plan

A greenfield UAE-focused AI accounting SaaS for SMEs: single Next.js app on Vercel + Supabase, with hybrid AI (OpenAI for smart entry, rule-based for bulk classification), targeting a ~20-week MVP.

---

## Finalized Technical Decisions

| Decision | Choice |
|----------|--------|
| Backend | Full-stack Next.js (TypeScript everywhere) |
| Hosting | Vercel + Supabase |
| Multi-tenancy | Shared DB + Row-Level Security (RLS) |
| Auth | Supabase Auth (email/password, MFA-ready) |
| Inventory costing | Both weighted average + FIFO (Phase 2, not MVP) |
| Payments | Stripe (post-MVP, no subscription in MVP) |
| NL Entry | OpenAI GPT-4o-mini (smart entry bar) + rule-based (bulk ops) |
| Repo structure | Single Next.js app (no turborepo) |
| Design/brand | To be provided later |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| PDF Generation | @react-pdf/renderer |
| Email | Resend |
| Hosting | Vercel |
| AI (smart entry) | OpenAI GPT-4o-mini (structured outputs) |
| AI (classification) | Rule-based engine in TypeScript |

---

## Architecture Highlights

### Accounting Engine (Core)
- **Immutable** `journal_entries` + `journal_lines` (append-only)
- Every business event → journal entries (single source of truth)
- Double-entry enforced at DB level (CHECK: debits = credits)
- Period locking via `accounting_periods.is_locked`
- Ledger balances derived from journal lines
- Balance caching with periodic reconciliation

### Multi-Tenancy
- `organization_id` on every table
- Supabase RLS policies enforce data isolation
- Secure query filtering at DB level

### AI Hybrid Approach
- **Smart entry bar**: OpenAI GPT-4o-mini parses natural language → structured transaction (~$0.01/mo per active user)
- **Bank classification**: Rule-based pattern matching + user correction learning
- **Per-org learning**: Corrections stored in `classification_rules`, improve suggestions over time

---

## Database Schema (Core Tables)

```
organizations, users, user_roles
chart_of_accounts, account_types
accounting_periods, fiscal_years
journal_entries, journal_lines
customers, suppliers
items, inventory_movements
invoices, invoice_lines
bills, bill_lines
payments, payment_allocations
bank_accounts, bank_transactions, bank_reconciliations
tax_codes, vat_returns, vat_return_lines
currencies, exchange_rates
classification_rules (AI learning)
audit_logs
employees, salary_records (payroll foundation)
```

---

## MVP Build Order — 9 Sprints (~20 weeks)

### Sprint 1: Foundation (Week 1–2)
- Next.js + Supabase + Drizzle scaffolding
- Auth flow (login, signup, org creation)
- Multi-tenant RLS setup
- Base UI shell (sidebar nav, layout, dark/light mode)
- Organization settings

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
- Quantity + cost tracking (weighted average for MVP)
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
- Rule-based transaction classification engine
- Smart account suggestions
- OpenAI-powered natural language entry bar
- Duplicate detection + anomaly alerts
- P&L, Balance Sheet reports
- Dashboard (cash, profit, VAT, overdue, alerts)
- UI polish + responsive design
- Payroll foundation (employee records, salary posting)

### Sprint 9: Launch Prep (Week 19–20)
- Onboarding flow
- Landing page
- Error handling + edge cases
- Performance optimization
- Security hardening
- First deploy to Vercel

---

## Deferred to Phase 2+
- Stripe subscription billing
- FIFO costing option
- Arabic UI
- OCR receipt scanning
- Direct bank feeds (API)
- Approval workflows
- FTA VAT submission format
- Accountant multi-client dashboard
- Full payroll engine (WPS)
- Multi-warehouse inventory
- Country tax engine + global expansion

---

## Next Step: Sprint 1 Implementation

Once confirmed, I will begin with:
1. `npx create-next-app` with App Router + TypeScript + Tailwind
2. Supabase project setup instructions
3. Drizzle ORM config + initial schema migration
4. Auth pages (login/signup)
5. Base layout with sidebar navigation
6. Dark/light mode toggle
7. Organization creation + settings page
