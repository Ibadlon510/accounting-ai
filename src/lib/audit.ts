import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

interface AuditLogParams {
  organizationId: string;
  userId?: string | null;
  action: "create" | "update" | "delete" | "post" | "reverse" | "apply" | "close";
  entity: string; // table/entity name
  entityId?: string;
  metadata?: Record<string, unknown>;
  tx?: typeof db; // optional transaction context
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  const dbClient = params.tx ?? db;
  try {
    await dbClient.insert(auditLogs).values({
      organizationId: params.organizationId,
      userId: params.userId ?? undefined,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? undefined,
      metadata: params.metadata ?? undefined,
    });
  } catch (e) {
    console.error("[audit] Failed to write audit log:", e);
  }
}
