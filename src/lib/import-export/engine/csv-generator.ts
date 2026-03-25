import Papa from "papaparse";
import { CSV_BOM } from "../types";
import type { ColumnDef } from "../types";

export function generateCSV(
  columns: ColumnDef[],
  rows: Record<string, unknown>[]
): string {
  const headers = columns.map((c) => c.header);
  const data = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.field];
      if (val === null || val === undefined) return "";
      if (typeof val === "boolean") return val ? "true" : "false";
      return String(val);
    })
  );

  const csv = Papa.unparse({ fields: headers, data });
  return CSV_BOM + csv;
}

export function generateTemplate(
  columns: ColumnDef[],
  childColumns?: ColumnDef[]
): string {
  const allCols = childColumns ? [...columns, ...childColumns] : columns;
  const importable = allCols.filter((c) => !c.exportOnly);

  const headers = importable.map((c) => c.header);
  const sampleRow = importable.map((c) => c.sample ?? "");

  const csv = Papa.unparse({ fields: headers, data: [sampleRow] });
  return CSV_BOM + csv;
}
