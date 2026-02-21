import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CURRENT_ORG_COOKIE } from "./constants";

/**
 * Get current organization ID from cookie and verify the authenticated user has access.
 * Returns null if not authenticated or no org selected / no access.
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const orgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value;
  if (!orgId) return null;

  const [role] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.organizationId, orgId)))
    .limit(1);
  if (!role) return null;

  return orgId;
}

/**
 * Get full current organization row. Returns null if not authenticated or no org.
 */
export async function getCurrentOrganization() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  return org ?? null;
}
