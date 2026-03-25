import { eq, and, inArray, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import type {
  EntityConfig,
  PreviewRow,
  PreviewResult,
  RowStatus,
  ForeignKeyLookup,
} from "../types";
import { parseCSVText, buildHeaderMap, mapRowToFields } from "./csv-parser";

type AnyTable = Record<string, unknown> & { id?: unknown; organizationId?: unknown };

function getTableColumn(table: unknown, colName: string): unknown {
  return (table as Record<string, unknown>)[colName];
}

async function buildFKLookupMap(
  lookup: ForeignKeyLookup,
  orgId: string | null
): Promise<Map<string, string>> {
  const table = lookup.lookupTable as unknown as AnyTable;
  const displayCol = getTableColumn(table, lookup.displayField) as SQL;
  const lookupCol = getTableColumn(table, lookup.lookupField) as SQL;
  const idCol = getTableColumn(table, "id") as SQL;

  const conditions: SQL[] = [];
  if (lookup.orgScoped && orgId) {
    const orgCol = getTableColumn(table, "organizationId") as SQL;
    conditions.push(eq(orgCol, orgId) as unknown as SQL);
  }

  let query;
  if (conditions.length > 0) {
    query = db
      .select({ id: idCol, display: displayCol, lookup: lookupCol })
      .from(lookup.lookupTable)
      .where(and(...conditions));
  } else {
    query = db
      .select({ id: idCol, display: displayCol, lookup: lookupCol })
      .from(lookup.lookupTable);
  }

  const rows = await query;
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = String(
      (row as Record<string, unknown>).display ?? (row as Record<string, unknown>).lookup ?? ""
    ).toLowerCase();
    map.set(key, String((row as Record<string, unknown>).id));
  }
  return map;
}

async function checkExistingIds(
  config: EntityConfig,
  ids: string[],
  orgId: string | null
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const table = config.table as unknown as AnyTable;
  const idCol = getTableColumn(table, "id") as SQL;

  const existing = new Set<string>();
  const batchSize = 500;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const conditions: SQL[] = [];
    if (config.orgScoped && orgId) {
      const orgCol = getTableColumn(table, "organizationId") as SQL;
      conditions.push(eq(orgCol, orgId) as unknown as SQL);
    }

    conditions.push(inArray(idCol, batch) as unknown as SQL);

    const rows = await db
      .select({ id: idCol })
      .from(config.table)
      .where(and(...conditions));

    for (const row of rows) {
      existing.add(String((row as Record<string, unknown>).id));
    }
  }
  return existing;
}

async function checkProtectedRecords(
  config: EntityConfig,
  ids: string[],
  orgId: string | null
): Promise<Map<string, string>> {
  const protectedMap = new Map<string, string>();
  if (!config.protectedFieldChecks || ids.length === 0) return protectedMap;

  const table = config.table as unknown as AnyTable;
  const idCol = getTableColumn(table, "id") as SQL;

  for (const check of config.protectedFieldChecks) {
    const checkCol = getTableColumn(table, check.field) as SQL;
    const conditions: SQL[] = [
      inArray(idCol, ids) as unknown as SQL,
      eq(checkCol, check.value) as unknown as SQL,
    ];
    if (config.orgScoped && orgId) {
      const orgCol = getTableColumn(table, "organizationId") as SQL;
      conditions.push(eq(orgCol, orgId) as unknown as SQL);
    }

    const rows = await db
      .select({ id: idCol })
      .from(config.table)
      .where(and(...conditions));

    for (const row of rows) {
      protectedMap.set(String((row as Record<string, unknown>).id), check.reason);
    }
  }
  return protectedMap;
}

export async function validateCSV(
  csvText: string,
  config: EntityConfig,
  orgId: string | null
): Promise<PreviewResult> {
  const parsed = parseCSVText(csvText);

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return {
      summary: { total: 0, creates: 0, updates: 0, errors: parsed.errors.length, skipped: 0 },
      rows: parsed.errors.map((e, i) => ({
        index: i,
        status: "error" as RowStatus,
        data: {},
        errors: [e],
        warnings: [],
      })),
      headers: parsed.headers,
    };
  }

  const allColumns = config.childConfig
    ? [...config.columns, ...config.childConfig.childColumns]
    : config.columns;
  const headerMap = buildHeaderMap(parsed.headers, allColumns);

  const mappedFieldNames = new Set([...headerMap.values()].map((c) => c.field));
  const missingRequired = allColumns.filter(
    (c) => c.required && !c.exportOnly && !mappedFieldNames.has(c.field)
  );
  if (missingRequired.length > 0) {
    const names = missingRequired.map((c) => `"${c.header}"`).join(", ");
    return {
      summary: { total: 0, creates: 0, updates: 0, errors: 1, skipped: 0 },
      rows: [{
        index: 0,
        status: "error" as RowStatus,
        data: {},
        errors: [`Missing required column(s): ${names}. Please include them in your CSV.`],
        warnings: [],
      }],
      headers: parsed.headers,
    };
  }

  const fkMaps = new Map<string, Map<string, string>>();
  const allLookups = [
    ...(config.foreignKeyLookups ?? []),
    ...(config.childConfig?.childForeignKeyLookups ?? []),
  ];
  for (const lookup of allLookups) {
    const map = await buildFKLookupMap(lookup, orgId);
    fkMaps.set(lookup.field, map);
  }

  const allIds: string[] = [];
  const parsedRows: { data: Record<string, unknown>; errors: string[]; rawRow: Record<string, string> }[] = [];

  for (const row of parsed.rows) {
    const result = mapRowToFields(row, headerMap, config);
    parsedRows.push({ ...result, rawRow: row });
    const id = result.data.id as string | null;
    if (id) allIds.push(id);
  }

  const existingIds = await checkExistingIds(config, allIds, orgId);
  const protectedRecords = await checkProtectedRecords(config, allIds, orgId);

  const previewRows: PreviewRow[] = [];
  let creates = 0, updates = 0, errors = 0, skipped = 0;

  for (let i = 0; i < parsedRows.length; i++) {
    const { data, errors: rowErrors, rawRow } = parsedRows[i];
    const warnings: string[] = [];
    const resolvedData = { ...data };
    let status: RowStatus;

    for (const lookup of allLookups) {
      const lookupMap = fkMaps.get(lookup.field);
      const rawValue = data[lookup.field];
      if (rawValue && lookupMap) {
        const resolved = lookupMap.get(String(rawValue).toLowerCase());
        if (resolved) {
          resolvedData[lookup.field] = resolved;
        } else {
          rowErrors.push(
            `"${lookup.displayField}" value "${rawValue}" not found`
          );
        }
      }
    }

    const id = data.id as string | null;

    if (id && protectedRecords.has(id)) {
      status = "skipped";
      warnings.push(protectedRecords.get(id)!);
      skipped++;
    } else if (rowErrors.length > 0) {
      status = "error";
      errors++;
    } else if (id && existingIds.has(id)) {
      status = "update";
      updates++;
    } else {
      status = "create";
      creates++;
    }

    previewRows.push({
      index: i,
      status,
      data,
      resolvedData,
      rawRow,
      errors: rowErrors,
      warnings,
    });
  }

  return {
    summary: {
      total: parsedRows.length,
      creates,
      updates,
      errors,
      skipped,
    },
    rows: previewRows,
    headers: parsed.headers,
  };
}
