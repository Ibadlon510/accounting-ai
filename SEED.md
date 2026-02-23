# Database seed (2025 data)

The seed script is the **only source of demo data**. It populates an organization with 2025 data that powers the dashboard, sales, purchases, banking, inventory, accounting, and VAT features.

## What gets seeded

- **Foundation** (always seeded when any module is selected): Account types, chart of accounts (UAE template), fiscal year & periods (FY 2025), tax codes.
- **Selectable modules**:
  - **sales** — Customers (6), invoices (12), payments.
  - **purchases** — Suppliers (5), bills (14).
  - **banking** — Bank accounts (2), bank transactions.
  - **inventory** — Items (8), inventory movements.
  - **accounting** — Journal entries (opening capital + monthly rent and salary).
  - **vat** — VAT returns for Q1–Q4 2025.

## How to run

From the project directory:

```bash
# Ensure DATABASE_URL is set (e.g. in .env or export)
npm run seed
```

Or with an explicit org (seeds into that org instead of first org / new demo):

```bash
SEED_ORG_ID=your-org-uuid npm run seed
```

To seed only specific modules (CLI):

```bash
SEED_MODULES=sales,purchases,banking npm run seed
```

Valid module names: `sales`, `purchases`, `banking`, `inventory`, `accounting`, `vat`. Omit `SEED_MODULES` to seed all modules.

## After seeding

- Use the seeded organization in the app (e.g. set it as current org after login/onboarding).
- All demo data is loaded from the database via API routes; there are no mock data sources.
