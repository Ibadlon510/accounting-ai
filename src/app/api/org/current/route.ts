import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentOrganization } from "@/lib/org/server";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const org = await getCurrentOrganization();
  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's role in this org
  let role = "viewer";
  const session = await auth();
  if (session?.user?.id) {
    const [userRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.organizationId, org.id)))
      .limit(1);
    if (userRole) role = userRole.role;
  }

  return NextResponse.json({
    id: org.id,
    name: org.name,
    currency: org.currency,
    subscriptionPlan: org.subscriptionPlan,
    tokenBalance: Number(org.tokenBalance ?? 0),
    numberFormat: org.numberFormat ?? "1,234.56",
    dateFormat: org.dateFormat ?? "DD/MM/YYYY",
    isVatRegistered: org.isVatRegistered ?? false,
    taxLabel: org.taxLabel ?? "VAT",
    defaultTaxCodeId: org.defaultTaxCodeId ?? null,
    role,
  });
}
