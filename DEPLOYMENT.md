# Deployment Guide — Render.com

## Prerequisites

- A [Render](https://render.com) account
- This repo pushed to GitHub/GitLab

## 1. Deploy via Blueprint

1. Go to **Render Dashboard → New → Blueprint**
2. Connect your repo
3. Render reads `render.yaml` and creates:
   - **PostgreSQL database** (`accounting-ai-db`, free tier)
   - **Web service** (`accounting-ai`, Node 20)
4. `DATABASE_URL` is auto-linked from the database
5. `AUTH_SECRET` is auto-generated

## 2. Set Environment Variables

In the Render Dashboard, add these to the **web service**:

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_URL` | Yes | Your app URL, e.g. `https://accounting-ai.onrender.com` |
| `GOOGLE_CLIENT_ID` | For OAuth | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Same |
| `GOOGLE_GEMINI_API_KEY` | For AI assistant | Google AI Studio |
| `OPENAI_API_KEY` | For AI features | OpenAI dashboard |
| `RESEND_API_KEY` | For emails | resend.com |
| `EMAIL_FROM` | For emails | e.g. `Agar <onboarding@resend.dev>` |
| `NEXT_PUBLIC_SITE_URL` | For email links | Your app URL |
| `AWS_ACCESS_KEY_ID` | For document vault | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | For document vault | AWS IAM |
| `AWS_REGION` | For document vault | e.g. `me-central-1` |
| `DOCUMENT_VAULT_BUCKET` | For document vault | S3 bucket name (Object Lock enabled — see below) |
| `DOCUMENT_VAULT_OBJECT_LOCK_MODE` | Optional | `COMPLIANCE` (default) or `GOVERNANCE` |

## 2b. Document Vault S3 bucket (Object Lock + 7-year retention)

Verified documents are copied from `temp/` to `retention-vault/` with **S3 Object Lock** so they cannot be deleted or overwritten until the retain-until date (now + **7 years**, UAE FTA / blueprint requirement).

**Bucket prerequisites (production):**

1. **Region:** create the bucket in `me-central-1` (UAE).
2. **Object Lock:** enable Object Lock **at bucket create time** (AWS does not allow enabling it later on an existing bucket). Use versioning (required with Object Lock).
3. **Prefixes:**
   - `temp/{orgId}/{documentId}/…` — uploads before verify (no lock required).
   - `retention-vault/{orgId}/{documentId}/…` — verified documents; app sets Object Lock on copy (`COMPLIANCE` by default, retain-until = now + 7 years).
4. **IAM:** the app credentials need `s3:GetObject`, `s3:PutObject`, `s3:PutObjectRetention` (and related copy permissions) on the bucket.

**Local / dev without Object Lock:** if the bucket was created without Object Lock, `moveToRetentionVault` logs a clear warning and still copies to `retention-vault/` **without** a lock so document verify keeps working. That path is **not** WORM-compliant — use a lock-enabled bucket for production.

**Optional mode:** set `DOCUMENT_VAULT_OBJECT_LOCK_MODE=GOVERNANCE` for staging (privileged bypass possible). Prefer `COMPLIANCE` in production.

Quick connectivity check (does not assert Object Lock):

```bash
node scripts/check-s3-vault.mjs
```

## 3. Google OAuth Setup

If using Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-app.onrender.com/api/auth/callback/google`
4. Copy Client ID and Secret to Render env vars

## 4. Database Migrations

Migrations run automatically during build (`npx drizzle-kit migrate` in the build command).

To run manually:
```bash
# Push schema directly (dev)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate
```

## 5. Local Development

```bash
# Copy env template
cp env.example .env.local

# Fill in DATABASE_URL and AUTH_SECRET at minimum
# Generate AUTH_SECRET: npx auth secret

# Install and run
npm install
npm run dev
```

## Architecture

- **Framework**: Next.js 16 (App Router, standalone output)
- **Auth**: NextAuth.js v5 (JWT sessions, Credentials + Google OAuth)
- **Database**: PostgreSQL on Render, Drizzle ORM
- **Email**: Resend
- **AI**: Google Gemini, OpenAI
- **Storage**: AWS S3 document vault (`temp/` → `retention-vault/` with Object Lock, 7-year retention)
