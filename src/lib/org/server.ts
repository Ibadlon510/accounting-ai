import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { organizations, userRoles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CURRENT_ORG_COOKIE } from "./constants";

/**
 * Get current organization ID from cookie and verify the authenticated user has access.
 * Returns null if not authenticated or no org selected / no access.
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const cookieStore = await cookies();
  const orgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value;
  if (!orgId) return null;

  const [appUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
  if (!appUser) return null;

  const [role] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, appUser.id), eq(userRoles.organizationId, orgId)))
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
