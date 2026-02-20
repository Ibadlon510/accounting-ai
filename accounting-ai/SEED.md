# Database seed (2025 data)

The seed script populates an organization with **full 2025 data** so you can replace mock data with real database content across the app.

## What gets seeded

- **Organization**: Uses existing org or creates "Demo 2025" if none exists.
- **Chart of accounts**: UAE template (via `seedChartOfAccounts`).
- **Fiscal year & periods**: FY 2025 with 12 monthly accounting periods.
- **Master data**: Customers (6), suppliers (5), items (8), bank accounts (2), tax codes.
- **Transactions (full 2025)**:
  - Invoices (12, one per month) with lines.
  - Bills (14) with lines.
  - Payments received and payment allocations to invoices.
  - Bank transactions (multiple per month).
  - Journal entries (opening capital + monthly rent and salary).
  - VAT returns for Q1–Q4 2025.
  - Inventory movements.

## How to run

From the `accounting-ai` directory:

```bash
# Ensure DATABASE_URL is set (e.g. in .env or export)
npm run seed
```

Or with an explicit org (seeds into that org instead of first org / new demo):

```bash
SEED_ORG_ID=your-org-uuid npm run seed
```

## After seeding

- Use the seeded organization in the app (e.g. set it as current org after login/onboarding).
- Replace mock data usage in dashboard, sales, purchases, banking, VAT, reports, and accounting pages by loading from your API/database instead of `@/lib/mock/*` and `@/lib/accounting/mock-data`.
