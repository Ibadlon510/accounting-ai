# Agar: Smart Accounting

**AI-powered smart accounting for businesses** — document extraction, VAT and tax compliance, multi-tenant workspaces, and real-time financial insights.

---

## Overview

Agar is a Next.js application that combines traditional double-entry accounting with AI-driven workflows:

- **Document Vault** — Upload invoices and receipts (PDF/images); AI extracts key data and suggests GL codes. Human-in-the-loop verify flow with split-screen PDF + form, then move to a compliant retention vault (AWS S3).
- **Token economy** — Organizations have a token balance; processing documents and using the AI assistant consume tokens (plan-based limits: Freelancer / Business / Enterprise).
- **VAT 201** — FTA-aligned VAT 201 report (box-level data) for return preparation.
- **Banking** — Bank transaction classification with rule-based + learning (classification rules) and optional "Suggest GL."
- **Smart entry** — Natural language → structured journal entry suggestion (e.g. "Office supplies 500 AED from ACE").
- **AI Assistant** — In-app chat for accounting questions, with token metering.

The app is multi-tenant (NextAuth.js + organizations), uses **PostgreSQL on Render** (Drizzle ORM), **AWS S3** for the document vault, **Google Gemini** for document extraction and assistant chat, and **OpenAI** for the smart-entry NL parser.

---

## Features

| Area | Description |
|------|-------------|
| **Auth & tenancy** | NextAuth.js v5 (email/password + Google OAuth), onboarding with org creation, workspace switcher, current-org cookie |
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
| **Auth** | NextAuth.js v5 (JWT sessions, Credentials + Google OAuth) |
| **Database** | PostgreSQL (Render), Drizzle ORM |
| **Storage (Vault)** | AWS S3 (me-central-1), presigned URLs for PDF viewing |
| **AI** | Google Gemini 1.5 Flash (extraction, assistant), OpenAI GPT-4o-mini (smart entry) |
| **Email** | Resend |
| **Validation** | Zod |
| **PDF** | react-pdf, pdfjs-dist |

---

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** (local or Render-hosted)
- **AWS** account (for Document Vault S3 bucket in `me-central-1`)
- **Google AI** API key (Gemini)
- **OpenAI** API key (for smart entry only)

---

## Environment Variables

Create a `.env.local` in the project root:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth.js (required)
AUTH_SECRET=generate-with-npx-auth-secret
AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini (required for document extraction & assistant chat)
GOOGLE_GEMINI_API_KEY=your-gemini-key

# OpenAI (required for smart entry bar)
OPENAI_API_KEY=your-openai-key

# Email (optional)
RESEND_API_KEY=your-resend-api-key

# AWS S3 Document Vault (required for document upload/verify)
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DOCUMENT_VAULT_BUCKET=your-bucket-name
```

Optional:

- `SEED_ORG_ID` — When running the seed script, target this organization ID instead of the first org or a new "Demo 2025" org.

---

**Deploying to Render:** See [DEPLOYMENT.md](DEPLOYMENT.md) for the full guide (Blueprint auto-setup, env vars, Google OAuth config).

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd AccountingAI
npm install
```

### 2. Database

Ensure PostgreSQL is running and `DATABASE_URL` is set. Then run migrations and (optionally) seed:

```bash
npm run db:push     # or: npm run db:generate && npm run db:migrate
npm run seed        # optional: full 2025 demo data for an org
```

### 3. Run the app

```bash
npm run dev
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
├── package.json
├── drizzle.config.ts
├── render.yaml                 # Render Blueprint (PostgreSQL + web service)
├── DEPLOYMENT.md               # Deployment guide
├── Main Plans/                 # Product/implementation plans
└── src/
    ├── app/
    │   ├── (auth)/             # login, signup, onboarding, verify-email, forgot/reset password
    │   ├── (dashboard)/        # dashboard, documents, banking, vat, accounting, sales, purchases, etc.
    │   ├── (marketing)/        # landing
    │   └── api/                # API routes (auth, documents, org, assistant, reports, bank-transactions, ai)
    ├── components/             # UI components, modals, AI (assistant panel, duplicate warning)
    └── lib/
        ├── ai/                 # extract-invoice (Gemini), schemas, smart-entry (OpenAI), classifier
        ├── auth/               # NextAuth.js config, helpers
        ├── db/                 # Drizzle schema, seed, seed-chart-of-accounts
        ├── email/              # Email templates (Resend)
        ├── storage/            # S3 vault client (vault.ts)
        └── accounting/         # UAE chart of accounts, etc.
```

---

## Key Flows

### Document flow

1. **Upload** — `POST /api/documents/upload` → file to S3 temp, row in `documents` (status `PENDING`).
2. **Process** — `POST /api/documents/[id]/process` → check tokens, fetch file from S3, run Gemini extraction (Zod + math guard), update document, decrement `tokenBalance`.
3. **Verify** — User opens `/documents/[id]/verify` (split-screen PDF + form). Optional: `GET /api/documents/duplicates` for duplicate warning. On submit, `PATCH /api/documents/[id]/verify` → move file to retention vault, create `document_transactions`, journal entry + lines, upsert `merchant_maps`, audit log.

### AI and reports

- **Assistant** — `POST /api/assistant/chat` (message) → Gemini with app context, token check/decrement, return reply.
- **Smart entry** — `POST /api/ai/smart-entry` (nl string) → OpenAI structured output → suggested journal entry (resolved to CoA).
- **Bank suggest/classify** — `POST /api/bank-transactions/suggest`, `POST /api/bank-transactions/classify` → rule-based + `classification_rules`.
- **VAT 201** — `GET /api/reports/vat-201?quarter=...` → box-level data for the selected period.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed DB (optional `SEED_ORG_ID`) |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:push` | Push schema directly (dev) |

---

## License

Proprietary. All rights reserved.
