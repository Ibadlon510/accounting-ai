import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, userRoles } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await db
    .select({
      organizationId: userRoles.organizationId,
      role: userRoles.role,
    })
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id));

  if (roles.length === 0) {
    return NextResponse.json({ organizations: [] });
  }

  const orgIds = roles.map((r) => r.organizationId);
  const orgsList = await db
    .select()
    .from(organizations)
    .where(inArray(organizations.id, orgIds));

  const roleByOrgId = Object.fromEntries(roles.map((r) => [r.organizationId, r.role]));

  const result = orgsList.map((org) => ({
    id: org.id,
    name: org.name,
    currency: org.currency,
    taxRegistrationNumber: org.taxRegistrationNumber,
    fiscalYearStart: org.fiscalYearStart,
    subscriptionPlan: org.subscriptionPlan,
    tokenBalance: Number(org.tokenBalance ?? 0),
    role: roleByOrgId[org.id] ?? "viewer",
  }));

  return NextResponse.json({ organizations: result });
}
