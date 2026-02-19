"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { organizations, userRoles, users } from "@/lib/db/schema";
import { CURRENT_ORG_COOKIE, COOKIE_MAX_AGE } from "@/lib/org/constants";
import { eq } from "drizzle-orm";
import { seedChartOfAccounts } from "@/lib/db/seed-chart-of-accounts";

export type OnboardingResult = { ok: true; redirect?: string } | { ok: false; error: string };

export async function createOrganizationAndLaunch(formData: {
  companyName: string;
  currency: string;
  fiscalYearStart: number;
  trn?: string;
}): Promise<OnboardingResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Auth not configured" };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return { ok: false, error: "Not authenticated" };
  }

  const { companyName, currency, fiscalYearStart, trn } = formData;
  if (!companyName?.trim()) {
    return { ok: false, error: "Company name is required" };
  }

  try {
    // Ensure app user exists (link Supabase auth to our users table)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    let appUserId: string;
    if (existingUser) {
      appUserId = existingUser.id;
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          authId: authUser.id,
          email: authUser.email ?? "",
          fullName: authUser.user_metadata?.full_name ?? authUser.email ?? "User",
        })
        .returning({ id: users.id });
      if (!inserted?.id) {
        return { ok: false, error: "Failed to create user record" };
      }
      appUserId = inserted.id;
    }

    // Create organization with token/plan fields
    const [org] = await db
      .insert(organizations)
      .values({
        name: companyName.trim(),
        currency: currency || "AED",
        fiscalYearStart: fiscalYearStart || 1,
        taxRegistrationNumber: trn?.trim() || null,
        subscriptionPlan: "FREELANCER",
        tokenBalance: 50,
      })
      .returning({ id: organizations.id });
    if (!org?.id) {
      return { ok: false, error: "Failed to create organization" };
    }

    // Link user to org as owner
    await db.insert(userRoles).values({
      userId: appUserId,
      organizationId: org.id,
      role: "owner",
    });

    // Seed UAE Chart of Accounts for the new org
    await seedChartOfAccounts(org.id);

    // Set current org cookie
    const cookieStore = await cookies();
    cookieStore.set(CURRENT_ORG_COOKIE, org.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return { ok: true, redirect: "/dashboard" };
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    console.error("Onboarding error:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
      query: err?.query,
      routine: err?.routine,
    });
    const msg = typeof err?.message === "string" ? err.message : "Failed to set up organization";
    const code = typeof err?.code === "string" ? ` [${err.code}]` : "";
    return { ok: false, error: `${msg}${code}` };
  }
}
