# Agar: Smart Accounting

**AI-powered smart accounting for businesses** — document extraction, VAT and tax compliance, multi-tenant workspaces, and real-time financial insights.

---

## Overview

Agar is a Next.js application that combines traditional double-entry accounting with AI-driven workflows:

- **Document Vault** — Upload invoices and receipts (PDF/images); AI extracts key data and suggests GL codes. Human-in-the-loop verify flow with split-screen PDF + form, then move to a compliant retention vault (AWS S3).
- **Token economy** — Organizations have a token balance; processing documents and using the AI assistant consume tokens (plan-based limits: Freelancer / Business / Enterprise).
- **VAT 201** — FTA-aligned VAT 201 report (box-level data) for return preparation.
- **Banking** — Bank transaction classification with rule-based + learning (classification rules) and optional “Suggest GL.”
- **Smart entry** — Natural language → structured journal entry suggestion (e.g. “Office supplies 500 AED from ACE”).
- **AI Assistant** — In-app chat for accounting questions, with token metering.

The app is multi-tenant (Supabase Auth + organizations), uses **PostgreSQL** (Drizzle ORM), **AWS S3** for the document vault, **Google Gemini** for document extraction and assistant chat, and **OpenAI** for the smart-entry NL parser.

---

## Features

| Area | Description |
|------|-------------|
| **Auth & tenancy** | Supabase Auth (login/signup), onboarding with org creation, workspace switcher, current-org cookie |
| **Document Vault** | Upload → Process (Gemini extraction) → Split-screen verify → S3 retention vault; duplicate detection; audit trail |
| **AI extraction** | Gemini 1.5 Flash, invoice extraction prompt, Zod validation, math guard (net + VAT ≈ total) |
| **VAT 201** | Report API and UI with FTA box mapping from document transactions and journal data |
| **Accounting core** | Chart of accounts, journal entries, general ledger, trial balance, periods, audit trail |
| **Sales / Purchases** | Invoices, bills, customers, suppliers, payments |
| **Banking** | Bank accounts, transactions, GL suggest/classify APIs, classification rules learning |
| **AI Assistant** | Chat API (Gemini), token deduction, suggestion chips; wired to real backend |
| **Smart entry** | NL → structured journal suggestion (OpenAI), wire to create-journal-entry UI |
| **Reports** | Profit & loss, balance sheet, VAT audit, inventory valuation |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion, Recharts |
| **State** | Zustand, TanStack React Query |
| **Auth** | Supabase (Auth + optional Storage for app files) |
| **Database** | PostgreSQL, Drizzle ORM |
| **Storage (Vault)** | AWS S3 (me-central-1), presigned URLs for PDF viewing |
| **AI** | Google Gemini 1.5 Flash (extraction, assistant), OpenAI GPT-4o-mini (smart entry) |
| **Validation** | Zod |
| **PDF** | react-pdf, pdfjs-dist |

---

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** (local or hosted; e.g. Supabase Postgres)
- **Supabase** project (for Auth; optional Storage)
- **AWS** account (for Document Vault S3 bucket in `me-central-1`)
- **Google AI** API key (Gemini)
- **OpenAI** API key (for smart entry only)

---

## Environment Variables

Create a `.env.local` in the `accounting-ai` directory (or set in your deployment):

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase (required for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini (required for document extraction & assistant chat)
GOOGLE_GEMINI_API_KEY=your-gemini-key

# OpenAI (required for smart entry bar)
OPENAI_API_KEY=your-openai-key

# AWS S3 Document Vault (required for document upload/verify)
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DOCUMENT_VAULT_BUCKET=your-bucket-name
```

Optional:

- `SEED_ORG_ID` — When running the seed script, target this organization ID instead of the first org or a new “Demo 2025” org.

---

**Deploying to Render:** Use the Transaction pooler (port 6543) for `DATABASE_URL`, and set Supabase Site URL and Redirect URLs to your production domain. See [accounting-ai/DEPLOYMENT.md](accounting-ai/DEPLOYMENT.md) for the full guide.

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd AccountingAI
npm install
```

All app code and dependencies live under `accounting-ai`; the root `package.json` delegates scripts to it.

### 2. Database

Ensure PostgreSQL is running and `DATABASE_URL` is set. Then run migrations and (optionally) seed:

```bash
cd accounting-ai
npx drizzle-kit push   # or: npx drizzle-kit generate && npx drizzle-kit migrate
npm run seed            # optional: full 2025 demo data for an org
```

Seed usage: `DATABASE_URL=... SEED_ORG_ID=<uuid> npm run seed` or leave `SEED_ORG_ID` unset to use/create the first org.

### 3. Run the app

From the **repository root**:

```bash
npm run dev
```

Or from `accounting-ai`:

```bash
cd accounting-ai && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects unauthenticated users to `/login`.

### 4. Build for production

```bash
npm run build
npm run start
```

---

## Project Structure

```
AccountingAI/
├── package.json                 # Workspace root; delegates to accounting-ai
├── README.md                   # This file
├── Main Plans/                 # Product/implementation plans (MVP, AI agents, etc.)
└── accounting-ai/              # Next.js application
    ├── package.json
    ├── drizzle.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # login, signup, onboarding
    │   │   ├── (dashboard)/   # dashboard, documents, banking, vat, accounting, sales, purchases, etc.
    │   │   ├── (marketing)/   # landing
    │   │   └── api/           # API routes (documents, org, assistant, reports, bank-transactions, ai)
    │   ├── components/        # UI components, modals, AI (assistant panel, duplicate warning)
    │   └── lib/
    │       ├── ai/            # extract-invoice (Gemini), schemas, smart-entry (OpenAI), classifier
    │       ├── db/            # Drizzle schema, seed, seed-chart-of-accounts
    │       ├── storage/       # S3 vault client (vault.ts)
    │       ├── supabase/       # Auth client, server, middleware
    │       └── accounting/    # UAE chart of accounts, etc.
    └── drizzle/               # Migrations (if using generate/migrate)
```

---

## Key Flows

### Document flow

1. **Upload** — `POST /api/documents/upload` → file to S3 temp, row in `documents` (e.g. status `PENDING`).
2. **Process** — `POST /api/documents/[id]/process` → check tokens, fetch file from S3, run Gemini extraction (Zod + math guard), update document, decrement `tokenBalance`.
3. **Verify** — User opens `/documents/[id]/verify` (split-screen PDF + form). Optional: `GET /api/documents/duplicates` for duplicate warning. On submit, `PATCH /api/documents/[id]/verify` → move file to retention vault, create `document_transactions`, journal entry + lines, upsert `merchant_maps`, audit log.

### AI and reports

- **Assistant** — `POST /api/assistant/chat` (message) → Gemini with app context, token check/decrement, return reply.
- **Smart entry** — `POST /api/ai/smart-entry` (nl string) → OpenAI structured output → suggested journal entry (resolved to CoA).
- **Bank suggest/classify** — `POST /api/bank-transactions/suggest`, `POST /api/bank-transactions/classify` → rule-based + `classification_rules`.
- **VAT 201** — `GET /api/reports/vat-201?quarter=...` → box-level data for the selected period.

---

## API Routes (summary)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/documents/upload` | POST | Upload file to S3, create document |
| `/api/documents` | GET | List documents (current org) |
| `/api/documents/[id]` | GET | Document detail |
| `/api/documents/[id]/process` | POST | Run AI extraction, decrement tokens |
| `/api/documents/[id]/verify` | PATCH | Verify, vault move, create transactions/journal/merchant maps |
| `/api/documents/[id]/url` | GET | Presigned URL for PDF |
| `/api/documents/duplicates` | GET | Duplicate candidates (merchant/amount/date) |
| `/api/assistant/chat` | POST | AI assistant chat (Gemini, token deduction) |
| `/api/ai/smart-entry` | POST | NL → suggested journal entry (OpenAI) |
| `/api/bank-transactions/suggest` | POST | Suggest GL for bank line |
| `/api/bank-transactions/classify` | POST | Persist classification (learning) |
| `/api/reports/vat-201` | GET | VAT 201 box data |
| `/api/org/current` | GET | Current organization |
| `/api/org/switch` | POST | Switch current org (cookie) |
| `/api/org/list` | GET | Orgs user can access |
| `/api/org/chart-of-accounts` | GET | Chart of accounts for current org |
| `/api/org/settings` | GET/PATCH | Org settings |

---

## Scripts

| Script | Where | Description |
|--------|--------|-------------|
| `npm run dev` | Root / accounting-ai | Start Next.js dev server |
| `npm run build` | Root / accounting-ai | Production build |
| `npm run start` | Root / accounting-ai | Start production server |
| `npm run lint` | Root / accounting-ai | Run ESLint |
| `npm run seed` | accounting-ai | Seed DB (optional `SEED_ORG_ID`) |

---

## Plans and roadmap

- **Main Plans/** — High-level product and sprint plans (e.g. AI Accounting Suite MVP, Connect AI Agents Next Steps). These describe phased delivery (Document Vault → AI extraction + verify + token economy → VAT 201 + Archive), and the desired state once all AI agents (assistant, smart entry, bank classification, duplicate detection) are connected.
- Implementation follows the existing stack (Next.js, Drizzle, Supabase, S3, Gemini, OpenAI) and aligns with those plans for schema, APIs, and UI placement.

---

## License

Proprietary. All rights reserved.
