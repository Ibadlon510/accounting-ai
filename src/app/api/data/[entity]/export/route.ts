import { NextResponse } from "next/server";
import { eq, asc, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getEntityConfig } from "@/lib/import-export/configs";
import { generateCSV } from "@/lib/import-export/engine/csv-generator";
import type { ColumnDef, ForeignKeyLookup } from "@/lib/import-export/types";

function getTableColumn(table: unknown, colName: string): unknown {
  return (table as Record<string, unknown>)[colName];
}

async function buildFKDisplayMaps(
  lookups: ForeignKeyLookup[],
  orgId: string | null
): Promise<Map<string, Map<string, string>>> {
  const maps = new Map<string, Map<string, string>>();

  for (const lookup of lookups) {
    const table = lookup.lookupTable as unknown as Record<string, unknown>;
    const idCol = getTableColumn(table, "id") as SQL;
    const displayCol = getTableColumn(table, lookup.displayField) as SQL;

    let rows;
    if (lookup.orgScoped && orgId) {
      const orgCol = getTableColumn(table, "organizationId") as SQL;
      rows = await db
        .select({ id: idCol, display: displayCol })
        .from(lookup.lookupTable)
        .where(eq(orgCol, orgId) as unknown as SQL);
    } else {
      rows = await db
        .select({ id: idCol, display: displayCol })
        .from(lookup.lookupTable);
    }

    const m = new Map<string, string>();
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      m.set(String(r.id), String(r.display ?? ""));
    }
    maps.set(lookup.field, m);
  }
  return maps;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const config = getEntityConfig(entity);
  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const table = config.table;
  const allLookups = [
    ...(config.foreignKeyLookups ?? []),
    ...(config.childConfig?.childForeignKeyLookups ?? []),
  ];
  const fkDisplayMaps = await buildFKDisplayMaps(allLookups, orgId);

  let allColumns: ColumnDef[];
  let dbRows: Record<string, unknown>[];

  if (config.childConfig) {
    allColumns = [...config.columns, ...config.childConfig.childColumns];
    const child = config.childConfig;
    const childParentFkCol = getTableColumn(child.childTable, child.parentFkField) as SQL;
    const childColumnHeaders = new Set(child.childColumns.map((c) => c.header));

    const parents = config.orgScoped
      ? await db
          .select()
          .from(table)
          .where(eq(getTableColumn(table, "organizationId") as SQL, orgId) as unknown as SQL)
          .orderBy(asc(getTableColumn(table, "createdAt") as SQL))
      : await db.select().from(table);

    dbRows = [];
    for (const parent of parents) {
      const p = parent as Record<string, unknown>;
      const childRows = await db
        .select()
        .from(child.childTable)
        .where(eq(childParentFkCol, p.id) as unknown as SQL)
        .orderBy(asc(getTableColumn(child.childTable, "lineOrder") as SQL));

      if (childRows.length === 0) {
        const row: Record<string, unknown> = {};
        for (const col of allColumns) {
          const dbKey = col.dbField ?? col.field;
          row[col.field] = childColumnHeaders.has(col.header) ? null : p[dbKey];
        }
        dbRows.push(row);
      } else {
        for (const ch of childRows) {
          const chRec = ch as Record<string, unknown>;
          const row: Record<string, unknown> = {};
          for (const col of allColumns) {
            const dbKey = col.dbField ?? col.field;
            row[col.field] = childColumnHeaders.has(col.header)
              ? chRec[dbKey]
              : p[dbKey];
          }
          dbRows.push(row);
        }
      }
    }
  } else {
    allColumns = config.columns;
    if (config.orgScoped) {
      const orgCol = getTableColumn(table, "organizationId") as SQL;
      dbRows = (await db
        .select()
        .from(table)
        .where(eq(orgCol, orgId) as unknown as SQL)
        .orderBy(asc(getTableColumn(table, "createdAt") as SQL))) as Record<string, unknown>[];
    } else {
      dbRows = (await db.select().from(table)) as Record<string, unknown>[];
    }
  }

  const exportRows = dbRows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const col of allColumns) {
      const dbKey = col.dbField ?? col.field;
      let value = row[col.field] ?? row[dbKey];
      const lookup = allLookups.find((l) => l.field === col.field);
      if (lookup && value) {
        const displayMap = fkDisplayMaps.get(lookup.field);
        if (displayMap) {
          value = displayMap.get(String(value)) ?? value;
        }
      }
      mapped[col.field] = value;
    }
    return mapped;
  });

  const csv = generateCSV(allColumns, exportRows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-export-${date}.csv"`,
    },
  });
}
