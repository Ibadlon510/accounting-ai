import { eq, and, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { EntityConfig, ImportResult, PreviewResult } from "../types";

function getTableColumn(table: unknown, colName: string): unknown {
  return (table as Record<string, unknown>)[colName];
}

function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

function buildUpdateSet(
  config: EntityConfig,
  data: Record<string, unknown>,
  isChild: boolean
): Record<string, unknown> {
  const cols = isChild
    ? config.childConfig!.childColumns
    : config.columns;

  const importable = cols.filter((c) => !c.exportOnly);
  const computed = new Set(config.computedFields ?? []);
  const set: Record<string, unknown> = {};

  for (const col of importable) {
    if (col.field === "id") continue;
    if (computed.has(col.field)) continue;
    if (data[col.field] !== undefined) {
      const dbKey = col.dbField ?? col.field;
      set[dbKey] = data[col.field];
    }
  }

  return set;
}

export async function executeImport(
  preview: PreviewResult,
  config: EntityConfig,
  orgId: string | null,
  userId: string | null,
  filename: string
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const actionableRows = preview.rows.filter(
    (r) => r.status === "create" || r.status === "update"
  );
  const skippedRows = preview.rows.filter(
    (r) => r.status === "skipped" || r.status === "error"
  );
  result.skipped = skippedRows.filter((r) => r.status === "skipped").length;
  result.failed = skippedRows.filter((r) => r.status === "error").length;

  if (actionableRows.length === 0) {
    return result;
  }

  const table = config.table;
  const idCol = getTableColumn(table, "id") as SQL;

  try {
    await db.transaction(async (tx) => {
      if (config.childConfig) {
        await executeParentChildImport(tx, actionableRows, config, orgId, result);
      } else {
        const sorted = config.selfReferentialField
          ? sortByParentFirst(actionableRows, config.selfReferentialField)
          : actionableRows;

        for (const row of sorted) {
          const data = row.resolvedData ?? row.data;
          const updateSet = buildUpdateSet(config, data, false);

          if (row.status === "update" && data.id) {
            const conditions: SQL[] = [eq(idCol, data.id) as unknown as SQL];
            if (config.orgScoped && orgId) {
              const orgCol = getTableColumn(table, "organizationId") as SQL;
              conditions.push(eq(orgCol, orgId) as unknown as SQL);
            }

            await tx
              .update(config.table)
              .set(updateSet)
              .where(and(...conditions));
            result.updated++;
          } else {
            const insertData = stripNulls({ ...updateSet });
            if (config.orgScoped && orgId) {
              insertData.organizationId = orgId;
            }
            await tx.insert(config.table).values(insertData);
            result.imported++;
          }
        }
      }
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    result.errors.push({
      row: -1,
      message: `Transaction failed: ${errorMsg}`,
    });
    result.imported = 0;
    result.updated = 0;
    result.failed = actionableRows.length;
  }

  try {
    await db.insert(auditLogs).values({
      organizationId: orgId!,
      userId: userId ?? null,
      action: "data_import",
      entity: config.slug,
      metadata: {
        filename,
        creates: result.imported,
        updates: result.updated,
        skipped: result.skipped,
        failed: result.failed,
      },
    });
  } catch {
    // audit log failure should not break the import
  }

  return result;
}

function buildParentKey(
  data: Record<string, unknown>,
  parentFields: Set<string>
): string {
  const parts: string[] = [];
  const sortedFields = [...parentFields].sort();
  for (const f of sortedFields) {
    if (f === "id") continue;
    parts.push(`${f}=${String(data[f] ?? "")}`);
  }
  return parts.join("|");
}

async function executeParentChildImport(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  rows: { index: number; status: string; data: Record<string, unknown>; resolvedData?: Record<string, unknown> }[],
  config: EntityConfig,
  orgId: string | null,
  result: ImportResult
) {
  const child = config.childConfig!;
  const parentFields = new Set(config.columns.map((c) => c.field));
  const childFields = new Set(child.childColumns.map((c) => c.field));

  const groups = new Map<
    string,
    {
      parentData: Record<string, unknown>;
      parentStatus: string;
      childRows: Record<string, unknown>[];
    }
  >();

  for (const row of rows) {
    const data = row.resolvedData ?? row.data;
    const parentId = data.id as string | null;
    const groupKey = parentId
      ? parentId
      : buildParentKey(data, parentFields);

    if (!groups.has(groupKey)) {
      const parentData: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (parentFields.has(k)) parentData[k] = v;
      }
      groups.set(groupKey, {
        parentData,
        parentStatus: row.status,
        childRows: [],
      });
    }

    const childData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (childFields.has(k)) childData[k] = v;
    }
    const hasChildValues = Object.values(childData).some(
      (v) => v !== null && v !== undefined && v !== ""
    );
    if (hasChildValues) {
      groups.get(groupKey)!.childRows.push(childData);
    }
  }

  const table = config.table;
  const childTable = child.childTable;
  const idCol = getTableColumn(table, "id") as SQL;
  const childParentFkCol = getTableColumn(childTable, child.parentFkField) as SQL;
  const computed = new Set(config.computedFields ?? []);

  for (const [, group] of groups) {
    let parentId: string;

    if (group.parentStatus === "update" && group.parentData.id) {
      parentId = group.parentData.id as string;
      const updateSet = buildUpdateSet(config, group.parentData, false);

      const conditions: SQL[] = [eq(idCol, parentId) as unknown as SQL];
      if (config.orgScoped && orgId) {
        const orgCol = getTableColumn(table, "organizationId") as SQL;
        conditions.push(eq(orgCol, orgId) as unknown as SQL);
      }

      await tx
        .update(config.table)
        .set(updateSet)
        .where(and(...conditions));

      await tx
        .delete(childTable)
        .where(eq(childParentFkCol, parentId) as unknown as SQL);

      result.updated++;
    } else {
      const insertData: Record<string, unknown> = {};
      for (const col of config.columns) {
        if (col.exportOnly || computed.has(col.field) || col.field === "id") continue;
        if (group.parentData[col.field] !== undefined && group.parentData[col.field] !== null) {
          const dbKey = col.dbField ?? col.field;
          insertData[dbKey] = group.parentData[col.field];
        }
      }
      if (config.orgScoped && orgId) {
        insertData.organizationId = orgId;
      }

      const [inserted] = await tx
        .insert(config.table)
        .values(insertData)
        .returning({ id: idCol });
      parentId = String((inserted as Record<string, unknown>).id);
      result.imported++;
    }

    for (let i = 0; i < group.childRows.length; i++) {
      const childData: Record<string, unknown> = {};
      for (const col of child.childColumns) {
        if (col.exportOnly || computed.has(col.field) || col.field === "id") continue;
        const val = group.childRows[i][col.field];
        if (val !== undefined && val !== null) {
          const dbKey = col.dbField ?? col.field;
          childData[dbKey] = val;
        }
      }
      childData[child.parentFkField] = parentId;
      childData.lineOrder = i + 1;
      if (config.orgScoped && orgId) {
        const hasOrgField = "organizationId" in (childTable as unknown as Record<string, unknown>);
        if (hasOrgField) {
          childData.organizationId = orgId;
        }
      }

      await tx.insert(childTable).values(childData);
    }
  }
}

function sortByParentFirst(
  rows: { index: number; data: Record<string, unknown>; resolvedData?: Record<string, unknown>; status: string }[],
  selfRefField: string
) {
  const parents = rows.filter((r) => {
    const d = r.resolvedData ?? r.data;
    return !d[selfRefField];
  });
  const children = rows.filter((r) => {
    const d = r.resolvedData ?? r.data;
    return !!d[selfRefField];
  });
  return [...parents, ...children];
}
