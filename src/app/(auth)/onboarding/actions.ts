"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, userRoles, users } from "@/lib/db/schema";
import { CURRENT_ORG_COOKIE, COOKIE_MAX_AGE } from "@/lib/org/constants";
import { eq } from "drizzle-orm";
import { seedChartOfAccounts } from "@/lib/db/seed-chart-of-accounts";

export type OnboardingResult = { ok: true; orgId: string } | { ok: false; error: string };

export async function createOrganizationAndLaunch(formData: {
  companyName: string;
  currency: string;
  fiscalYearStart: number;
  trn?: string;
}): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated" };
  }

  const { companyName, currency, fiscalYearStart, trn } = formData;
  if (!companyName?.trim()) {
    return { ok: false, error: "Company name is required" };
  }

  try {
    // Verify user exists in our DB
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!existingUser) {
      return { ok: false, error: "User record not found" };
    }

    // Create organization with token/plan fields
    const [org] = await db
      .insert(organizations)
      .values({
        name: companyName.trim(),
        currency: currency || "AED",
        fiscalYearStart: fiscalYearStart || 1,
        taxRegistrationNumber: trn?.trim() || null,
        subscriptionPlan: "FREE",
        tokenBalance: 0,
      })
      .returning({ id: organizations.id });
    if (!org?.id) {
      return { ok: false, error: "Failed to create organization" };
    }

    // Link user to org as owner
    await db.insert(userRoles).values({
      userId: session.user.id,
      organizationId: org.id,
      role: "owner",
    });

    // Seed UAE Chart of Accounts (structural data needed for GL mapping)
    await seedChartOfAccounts(org.id);

    // Set current org cookie
    const cookieStore = await cookies();
    cookieStore.set(CURRENT_ORG_COOKIE, org.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    // Fire-and-forget: send verification email if not already verified
    if (!existingUser.emailVerified) {
      const { randomBytes, createHash } = await import("crypto");
      const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
      const { verificationTokens } = await import("@/lib/db/schema");
      const { sendVerificationEmail } = await import("@/lib/email/verify-email");

      const identifier = `verify:${existingUser.email}`;
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier)).catch(() => {});

      const rawToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(verificationTokens).values({ identifier, token: hashToken(rawToken), expires }).catch(() => {});

      const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(existingUser.email)}`;

      sendVerificationEmail({ to: existingUser.email, verifyUrl, name: existingUser.name }).catch(() => {});
    }

    return { ok: true, orgId: org.id };
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
