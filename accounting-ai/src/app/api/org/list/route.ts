import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { organizations, userRoles, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [appUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
  if (!appUser) {
    return NextResponse.json({ organizations: [] });
  }

  const roles = await db
    .select({
      organizationId: userRoles.organizationId,
      role: userRoles.role,
    })
    .from(userRoles)
    .where(eq(userRoles.userId, appUser.id));

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
