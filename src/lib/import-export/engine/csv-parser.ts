import Papa from "papaparse";
import type { ColumnDef, EntityConfig } from "../types";
import { MAX_ROW_COUNT } from "../types";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildHeaderMap(
  csvHeaders: string[],
  columns: ColumnDef[]
): Map<string, ColumnDef> {
  const map = new Map<string, ColumnDef>();
  for (const col of columns) {
    const normalizedColHeader = normalizeHeader(col.header);
    const match = csvHeaders.find(
      (h) => normalizeHeader(h) === normalizedColHeader
    );
    if (match) {
      map.set(match, col);
    }
  }
  return map;
}

export function parseCSVText(text: string): ParsedCSV {
  const stripped = text.startsWith("\uFEFF") ? text.slice(1) : text;

  const result = Papa.parse<Record<string, string>>(stripped, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: string[] = [];
  if (result.errors.length > 0) {
    for (const err of result.errors.slice(0, 10)) {
      errors.push(`Row ${err.row ?? "?"}: ${err.message}`);
    }
  }

  if (result.data.length > MAX_ROW_COUNT) {
    errors.push(
      `File contains ${result.data.length} rows, which exceeds the maximum of ${MAX_ROW_COUNT}.`
    );
    return { headers: result.meta.fields ?? [], rows: [], errors };
  }

  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
    errors,
  };
}

export function mapRowToFields(
  row: Record<string, string>,
  headerMap: Map<string, ColumnDef>,
  config: EntityConfig
): { data: Record<string, unknown>; errors: string[] } {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  const allColumns = config.childConfig
    ? [...config.columns, ...config.childConfig.childColumns]
    : config.columns;

  for (const [csvHeader, col] of headerMap.entries()) {
    if (col.exportOnly) continue;

    const raw = row[csvHeader]?.trim() ?? "";

    if (raw === "") {
      data[col.field] = null;
      continue;
    }

    switch (col.type) {
      case "string":
        data[col.field] = raw;
        break;
      case "number": {
        const cleaned = raw.replace(/,/g, "");
        if (isNaN(Number(cleaned))) {
          errors.push(`"${col.header}" must be a valid number, got "${raw}"`);
        } else {
          data[col.field] = cleaned;
        }
        break;
      }
      case "integer": {
        const intVal = parseInt(raw, 10);
        if (isNaN(intVal)) {
          errors.push(`"${col.header}" must be an integer, got "${raw}"`);
        } else {
          data[col.field] = intVal;
        }
        break;
      }
      case "date": {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(raw)) {
          errors.push(
            `"${col.header}" must be a date in YYYY-MM-DD format, got "${raw}"`
          );
        } else {
          data[col.field] = raw;
        }
        break;
      }
      case "boolean": {
        const lower = raw.toLowerCase();
        if (["true", "1", "yes"].includes(lower)) {
          data[col.field] = true;
        } else if (["false", "0", "no"].includes(lower)) {
          data[col.field] = false;
        } else {
          errors.push(
            `"${col.header}" must be true/false, got "${raw}"`
          );
        }
        break;
      }
    }
  }

  const importableColumns = allColumns.filter((c) => !c.exportOnly);
  for (const col of importableColumns) {
    if (col.required && (data[col.field] === null || data[col.field] === undefined)) {
      const inMap = [...headerMap.values()].some((c) => c.field === col.field);
      if (!inMap) continue;
      errors.push(`"${col.header}" is required`);
    }
  }

  return { data, errors };
}
