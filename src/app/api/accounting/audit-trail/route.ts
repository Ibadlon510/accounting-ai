import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";

export async function GET(request: NextRequest) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50", 10) || 50));
  const action = params.get("action") ?? "";
  const entity = params.get("entity") ?? "";

  try {
    const conditions = [eq(auditLogs.organizationId, orgId)];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (entity) conditions.push(eq(auditLogs.entity, entity));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [totalRow] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(where);

    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const logs = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: r.metadata,
      user: r.userName ?? "System",
      createdAt: r.createdAt?.toISOString() ?? "",
    }));

    return NextResponse.json({
      logs,
      total: Number(totalRow?.total ?? 0),
      page,
      limit,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load audit logs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
