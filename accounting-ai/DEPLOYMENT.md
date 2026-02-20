# Deploying to Render (and fixing onboarding after email confirmation)

Follow these steps so your app works on Render and users can complete signup → email confirmation → onboarding.

---

## 1. Set environment variables on Render

In your Render service → **Environment** tab, add (or update) these. Use **Secret Files** or **Environment** for secrets.

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** | Use the **Transaction pooler** URL (port **6543**), not direct 5432. From Supabase: **Dashboard → Connect → Transaction pooler** — copy the URI and replace `[YOUR-PASSWORD]` with your DB password. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | From Supabase Dashboard → Settings → API (Project URL). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | From Supabase Dashboard → Settings → API (anon public). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | For server-side auth (e.g. callback). Same dashboard → API → service_role. |
| `GOOGLE_GEMINI_API_KEY` | For AI | Needed for document extraction and assistant. |
| `OPENAI_API_KEY` | Optional | For smart entry. |
| AWS_* | Optional | For document vault (S3). |

**Important:** For `DATABASE_URL` do **not** use a placeholder. Use the real connection string with port **6543** (transaction pooler). Direct port 5432 often fails on serverless (e.g. IPv6 or connection limits).

---

## 2. Configure Supabase redirect URLs (critical for email confirmation)

If these are wrong, the link in the confirmation email will point to localhost or the wrong domain and onboarding will never start.

1. Open **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Render app URL, e.g.  
   `https://your-service-name.onrender.com`  
   (no trailing slash).
3. Under **Redirect URLs**, add:
   - `https://your-service-name.onrender.com/auth/callback`
   - `https://your-service-name.onrender.com/**`  
   (or add other routes you use for auth redirects).

Save. New confirmation and password-reset emails will use this Site URL.

---

## 3. (Optional) Set a custom domain in Supabase

If you later use a custom domain on Render (e.g. `app.yourapp.com`):

1. Update **Site URL** in Supabase to `https://app.yourapp.com`.
2. Add the same redirect URLs with your custom domain.

---

## 4. Deploy and test the flow

1. Deploy (or redeploy) on Render so it uses the new env vars and Supabase URL config.
2. **Sign up** with a new email on the Render URL.
3. Open the **confirmation email** and click the link.  
   You should land on:  
   `https://your-app.onrender.com/auth/callback?...`  
   then redirect to verify-email → then onboarding.
4. On the **onboarding** page, fill company name (and optional TRN/currency) and submit.  
   This uses the database; if `DATABASE_URL` is wrong or the pooler is unreachable, you’ll see “Onboarding failed” or a DB error.

---

## 5. If “Render didn’t work” or onboarding still fails

| Symptom | What to check |
|--------|----------------|
| Confirmation link goes to localhost or wrong site | Supabase **Site URL** and **Redirect URLs** (step 2). Clear cache and request a new confirmation email if needed. |
| Redirect to login with `?error=auth` | Auth failed in callback (e.g. expired or invalid token). Try signing up again and use the latest confirmation link. |
| “Auth not configured” | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set on Render. |
| “Onboarding failed” or DB errors on submit | `DATABASE_URL` on Render must be set and use **port 6543** (transaction pooler). Test with `GET /api/debug/db` on the Render URL (if that route exists) to confirm DB connectivity. |
| Redirect after confirmation goes to wrong path | Auth callback uses `x-forwarded-host` / `x-forwarded-proto`. Ensure Render is sending those headers (default for Render web services). |

---

## 6. Quick checklist

- [ ] `DATABASE_URL` on Render = Supabase **Transaction pooler** URI (port **6543**), real password, no placeholder.
- [ ] Supabase **Site URL** = your Render (or custom) app URL.
- [ ] Supabase **Redirect URLs** include `https://<your-app>/auth/callback`.
- [ ] All required env vars set on Render (see table in step 1).
- [ ] Redeploy after changing env or Supabase URL config.

After that, email confirmation and onboarding should work on Render.
