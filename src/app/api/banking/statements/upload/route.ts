import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatements, bankStatementLines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** Split a single CSV line into fields, respecting RFC 4180 quoted fields. */
function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): { date: string; description: string; amount: number; type: "credit" | "debit" }[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const rows: { date: string; description: string; amount: number; type: "credit" | "debit" }[] = [];
  const headerFields = splitCSVLine(lines[0]);
  const headerLower = headerFields.map((h) => h.toLowerCase());
  const hasHeader = headerLower.some((h) => h.includes("date")) && headerLower.some((h) => h.includes("amount") || h.includes("description") || h.includes("credit") || h.includes("debit"));

  const dateCol = headerLower.findIndex((h) => h.includes("date"));
  const descCol = headerLower.findIndex((h) => h.includes("description") || h.includes("narrative") || h.includes("details") || h.includes("memo"));
  const amountCol = headerLower.findIndex((h) => h === "amount" || h.includes("amount"));
  const creditCol = headerLower.findIndex((h) => h === "credit" || h.includes("credit"));
  const debitCol = headerLower.findIndex((h) => h === "debit" || h.includes("debit"));
  const hasSplitColumns = creditCol !== -1 && debitCol !== -1;

  const startIdx = hasHeader ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);
    if (parts.length < 2) continue;

    let date = "";
    let description = "";
    let amount = 0;
    let type: "credit" | "debit" = "debit";

    if (hasHeader) {
      date = dateCol >= 0 ? (parts[dateCol] || "") : "";
      description = descCol >= 0 ? (parts[descCol] || "") : "";

      if (hasSplitColumns) {
        const cr = parseFloat((parts[creditCol] || "0").replace(/[^0-9.-]/g, "") || "0");
        const dr = parseFloat((parts[debitCol] || "0").replace(/[^0-9.-]/g, "") || "0");
        if (cr > 0) { amount = cr; type = "credit"; }
        else { amount = Math.abs(dr); type = "debit"; }
      } else if (amountCol >= 0) {
        const num = parseFloat((parts[amountCol] || "0").replace(/[^0-9.-]/g, "") || "0");
        amount = Math.abs(num);
        type = num > 0 ? "credit" : "debit";
      }
    } else if (parts.length >= 3) {
      date = parts[0] || "";
      description = parts[1] || "";
      const num = parseFloat((parts[2] || "0").replace(/[^0-9.-]/g, "") || "0");
      amount = Math.abs(num);
      type = num > 0 ? "credit" : "debit";
    } else if (parts.length === 2) {
      description = parts[0] || "";
      const num = parseFloat((parts[1] || "0").replace(/[^0-9.-]/g, "") || "0");
      amount = Math.abs(num);
      type = num >= 0 ? "credit" : "debit";
      date = new Date().toISOString().slice(0, 10);
    }

    if (description || amount > 0) {
      if (!date) date = new Date().toISOString().slice(0, 10);
      rows.push({ date, description, amount, type });
    }
  }
  return rows;
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const bankAccountId = formData.get("bankAccountId") as string | null;

  if (!file || !bankAccountId) {
    return NextResponse.json({ error: "Missing file or bankAccountId" }, { status: 400 });
  }

  const ext = (file.name || "").toLowerCase().split(".").pop();
  if (ext !== "csv") {
    return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  const rows = parseCSV(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid transactions found in CSV" }, { status: 400 });
  }

  try {
    const [stmt] = await db
      .insert(bankStatements)
      .values({
        organizationId: orgId,
        bankAccountId,
        fileName: file.name,
        status: "pending",
      })
      .returning();

    if (!stmt) return NextResponse.json({ error: "Failed to create statement" }, { status: 500 });

    await db.insert(bankStatementLines).values(
      rows.map((r, i) => ({
        bankStatementId: stmt.id,
        transactionDate: r.date,
        description: r.description,
        amount: String(r.amount),
        type: r.type,
        lineOrder: i + 1,
      }))
    );

    return NextResponse.json({ ok: true, statementId: stmt.id, lineCount: rows.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create statement";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
