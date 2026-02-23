# Banking Module & Dashboard Pill — Quality Review

Comprehensive review of the Banking Pill Nav & Panels implementation and the Sales Mini Dashboard Pill implementation, identifying gaps, bugs, and quality recommendations.

---

## A. Banking Pill Nav & Panels

### ✅ What's Correct

- **Layout & navigation** (`banking/layout.tsx`): Clean pill nav with `usePathname` active-state logic, breadcrumbs, consistent with sales/purchases layouts.
- **All 4 pages** implemented: Accounts, Receipts, Payments, Transfers — each with search, table, loading/empty states.
- **All API routes** implemented: `receipts`, `payments`, `transfers`, `statements`, `statement-lines`, `statements/upload`, `reconciliation/matches`, `reconciliation/link`, `reconciliation/create-from-line`.
- **Modal panels** (`record-receipt-panel`, `record-payment-banking-panel`, `transfer-panel`): Proper EntityPanel pattern, allocation logic, validation, API calls, reset-on-close.
- **Reconciliation** (`reconciliation-two-column.tsx`): Two-column layout, CSV upload, fuzzy matching (amount/date/description scoring), link & create-from-line flows.
- **Schema**: `bankTransactions`, `bankStatements`, `bankStatementLines` all properly defined with FK references and cascading deletes.

### 🔴 Critical Gaps

| # | Issue | File(s) | Action |
|---|-------|---------|--------|
| 1 | **Missing DB migration** for `transfer_reference`, `payment_id` columns on `bank_transactions`, and the entire `bank_statements` / `bank_statement_lines` tables. Schema.ts defines them but no migration SQL exists (0000_init.sql only has the original `bank_transactions` without these columns). | `drizzle/` | Create migration `0004_add_banking_columns_and_tables.sql` with ALTER TABLE for new columns + CREATE TABLE for new tables. |
| 2 | **No database transaction wrapping** on multi-step writes. Receipts/payments API routes insert a payment, bank transaction, journal entry, journal lines, and update balances in separate queries — a failure mid-way leaves the DB inconsistent. | `api/banking/receipts/route.ts`, `api/banking/payments/route.ts`, `api/banking/transfers/route.ts` | Wrap all POST handlers in `db.transaction(async (tx) => { ... })`. |
| 3 | **`create-from-line` calls its own server via `fetch()`** to `api/banking/receipts` and `api/banking/payments`. This is fragile (requires constructing `baseUrl`, forwarding cookies, self-referencing). | `api/banking/reconciliation/create-from-line/route.ts` | Extract the receipt/payment creation logic into shared service functions and call them directly instead of HTTP round-tripping. |

### 🟡 Quality Recommendations

| # | Issue | File(s) | Recommendation |
|---|-------|---------|----------------|
| 4 | **Hardcoded currency "AED"** in toast messages and panel UI. Should use the bank account's currency or org default. | `record-receipt-panel.tsx`, `record-payment-banking-panel.tsx`, `transfer-panel.tsx` | Read currency from selected bank account and pass to `formatNumber`. |
| 5 | **No optimistic loading or SWR/React Query** on banking pages — all 4 pages use raw `useEffect` + `fetch` + manual state. The dashboard pill content correctly uses `@tanstack/react-query`. | `banking/page.tsx`, `receipts/page.tsx`, `payments/page.tsx`, `transfers/page.tsx` | Migrate to `useQuery` for consistency, automatic caching, and refetch-on-focus. |
| 6 | **`useEffect` dependency warning** — `bankAccountId` is used inside useEffect but not in the dependency array in both receipt and payment panels. | `record-receipt-panel.tsx:83`, `record-payment-banking-panel.tsx:83` | Add `bankAccountId` to deps or suppress with a ref pattern. |
| 7 | **N+1 query in statement-lines** — when fetching by `bankAccountId`, it loops over each statement and queries lines individually. | `api/banking/statement-lines/route.ts:64-83` | Use a single JOIN query: `bankStatementLines JOIN bankStatements WHERE bankAccountId = ?`. |
| 8 | **N+1 query in statements GET** — loops through statements and queries line counts one by one. | `api/banking/statements/route.ts:26-42` | Use a subquery or LEFT JOIN with GROUP BY. |
| 9 | **CSV parser is naive** — only handles comma-delimited, no quoted fields with commas, no multi-column debit/credit format (common in bank exports). | `api/banking/statements/upload/route.ts:7-46` | Use a proper CSV library (e.g., `papaparse`) and support common bank formats (separate debit/credit columns). |
| 10 | **Reconciliation matching loads ALL unreconciled transactions** into memory for scoring. Won't scale. | `api/banking/reconciliation/matches/route.ts:40-58` | Add SQL-level pre-filtering (amount range ±10%, date range ±30 days) before in-memory scoring. |
| 11 | **No pagination** on any banking list page (receipts, payments, transfers, statement lines). | All banking pages | Add cursor or offset pagination to both API and UI. |
| 12 | **Duplicate type definitions** — `BankAccount`, `Customer`, `Supplier`, `Allocation` types are copy-pasted across receipt and payment panels. | `record-receipt-panel.tsx`, `record-payment-banking-panel.tsx` | Extract shared types to `src/lib/banking/types.ts`. |
| 13 | **Transfer panel doesn't validate sufficient balance** before transferring. The API also doesn't check. | `transfer-panel.tsx`, `api/banking/transfers/route.ts` | Add balance check in API POST to prevent negative balances (if business rules require it). |
| 14 | **No `key` prop on React list items** using `index` as key in reconciliation matches. | `reconciliation-two-column.tsx:195` | Already uses `l.id` and `m.id` — this is fine. No action needed. |

---

## B. Sales Mini Dashboard Pill

### ✅ What's Correct

- **All 4 components created**: `dashboard-pill.tsx`, `dashboard-pill-content.tsx`, `dashboard-widget.tsx`, `dashboard-customize-panel.tsx`.
- **Preferences hook** (`use-dashboard-pill-preferences.ts`): localStorage persistence, per-variant widget visibility, reset, proper SSR guard.
- **DashboardPill integrated** into all 5 layouts/pages: Sales, Purchases, Documents, Inventory, Banking.
- **Widget IDs and labels** match the plan exactly for all 5 variants.
- **Customize panel** with checkboxes and Reset button works correctly.
- **Charts**: All chart types (Bar, Line, Pie, Scatter) implemented per plan using Recharts.
- **Path-to-variant mapping** correct in `dashboard-pill.tsx`.

### 🔴 Critical Gaps

| # | Issue | File(s) | Action |
|---|-------|---------|--------|
| 1 | **All 5 mini-stats API routes are missing.** The plan specifies creating `api/sales/mini-stats/route.ts`, `api/purchases/mini-stats/route.ts`, `api/documents/mini-stats/route.ts`, `api/inventory/mini-stats/route.ts`, `api/banking/mini-stats/route.ts`. None exist. The dashboard pill content fetches from `/api/{variant}/mini-stats` and will get 404s. | `src/app/api/` | Create all 5 API routes returning the data shapes expected by `dashboard-pill-content.tsx`. |

### 🟡 Quality Recommendations

| # | Issue | File(s) | Recommendation |
|---|-------|---------|----------------|
| 2 | **718-line monolith component** — `dashboard-pill-content.tsx` has all 5 variant renderings in one file. Hard to maintain. | `dashboard-pill-content.tsx` | Split into per-variant sub-components: `SalesDashboard`, `PurchasesDashboard`, etc. |
| 3 | **Excessive `as` type assertions** throughout `dashboard-pill-content.tsx`. Data from the API is typed as `Record<string, unknown>` and then cast inline everywhere (`mini.avgInvoiceValue as number`, etc.). | `dashboard-pill-content.tsx` | Define typed response interfaces per variant and type the `useQuery` generics properly. |
| 4 | **No error boundary or per-widget error handling** — if one widget's data is malformed, it could crash the entire popover. | `dashboard-pill-content.tsx` | Wrap each `DashboardWidget` in an error boundary, or use try/catch in rendering. |
| 5 | **`widgetId` prop on `DashboardWidget` is unused** beyond `data-widget-id` attribute. | `dashboard-widget.tsx` | Fine for debugging/testing, but could be removed if not needed. Low priority. |
| 6 | **Popover doesn't close on outside scroll** and the sticky header may conflict with popover portal positioning on smaller screens. | `dashboard-pill.tsx` | Test on mobile/tablet breakpoints. Consider `modal={true}` on Popover or a drawer on small screens. |

---

## C. Implementation Priority

### Must Fix (before release)

1. **Create missing migration** for banking schema changes (Banking #1)
2. **Create all 5 mini-stats API routes** (Dashboard Pill #1)
3. **Wrap banking POST handlers in DB transactions** (Banking #2)
4. **Refactor `create-from-line` to avoid self-fetch** (Banking #3)

### Should Fix (quality)

5. Fix N+1 queries in statement-lines and statements (Banking #7, #8)
6. Migrate banking pages to `useQuery` (Banking #5)
7. Extract shared types (Banking #12)
8. Split `dashboard-pill-content.tsx` into per-variant components (Dashboard #2)
9. Add typed response interfaces for mini-stats (Dashboard #3)

### Nice to Have

10. Hardcoded currency → dynamic (Banking #4)
11. Pagination on banking lists (Banking #11)
12. Better CSV parser (Banking #9)
13. Reconciliation match pre-filtering (Banking #10)
14. Transfer balance validation (Banking #13)
15. Per-widget error boundary (Dashboard #4)
16. Mobile/responsive testing for popover (Dashboard #6)
