import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documentTransactions, documents } from "@/lib/db/schema";
import { eq, and, ne, gte, lte } from "drizzle-orm";

const DATE_WINDOW_DAYS = 7;
const AMOUNT_TOLERANCE = 0.01;

function normalizeMerchant(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function merchantSimilarity(a: string, b: string): number {
  const na = normalizeMerchant(a);
  const nb = normalizeMerchant(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = new Set(na.split(/\s+/).filter((w) => w.length > 1));
  const wordsB = new Set(nb.split(/\s+/).filter((w) => w.length > 1));
  let match = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) match++;
  }
  const jaccard = wordsA.size + wordsB.size - match > 0 ? match / (wordsA.size + wordsB.size - match) : 0;
  return Math.round(jaccard * 100) / 100;
}

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const merchantName = searchParams.get("merchantName")?.trim() ?? "";
  const amountParam = searchParams.get("amount");
  const date = searchParams.get("date") ?? ""; // YYYY-MM-DD
  const excludeDocumentId = searchParams.get("excludeDocumentId") ?? "";

  if (!merchantName || amountParam === null || amountParam === "") {
    return NextResponse.json({ duplicates: [] });
  }

  const amount = Number.parseFloat(amountParam);
  if (Number.isNaN(amount)) {
    return NextResponse.json({ duplicates: [] });
  }

  const dateStart = date ? new Date(date) : null;
  const dateEnd = date ? new Date(date) : null;
  if (dateStart) dateStart.setDate(dateStart.getDate() - DATE_WINDOW_DAYS);
  if (dateEnd) dateEnd.setDate(dateEnd.getDate() + DATE_WINDOW_DAYS);
  const dateStartStr = dateStart?.toISOString().slice(0, 10) ?? "1900-01-01";
  const dateEndStr = dateEnd?.toISOString().slice(0, 10) ?? "2099-12-31";

  const amountMin = amount - AMOUNT_TOLERANCE;
  const amountMax = amount + AMOUNT_TOLERANCE;

  const candidates = await db
    .select({
      documentId: documentTransactions.documentId,
      merchantName: documentTransactions.merchantName,
      totalAmount: documentTransactions.totalAmount,
      date: documentTransactions.date,
    })
    .from(documentTransactions)
    .innerJoin(documents, eq(documents.id, documentTransactions.documentId))
    .where(
      and(
        eq(documentTransactions.organizationId, orgId),
        gte(documentTransactions.date, dateStartStr),
        lte(documentTransactions.date, dateEndStr),
        ...(excludeDocumentId ? [ne(documentTransactions.documentId, excludeDocumentId)] : [])
      )
    );

  const duplicates: Array<{
    documentId: string;
    merchantName: string;
    amount: number;
    date: string;
    similarity: number;
  }> = [];

  const normInput = normalizeMerchant(merchantName);
  for (const row of candidates) {
    const rowAmount = Number(row.totalAmount);
    if (rowAmount < amountMin || rowAmount > amountMax) continue;

    const simMerchant = merchantSimilarity(merchantName, row.merchantName);
    if (simMerchant < 0.5) continue;

    let sim = simMerchant;
    if (Math.abs(rowAmount - amount) > 0) sim *= 0.95;
    const rowDate = String(row.date);
    if (date && rowDate !== date) {
      const daysDiff = Math.abs(new Date(rowDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 3) sim *= 0.9;
    }

    duplicates.push({
      documentId: row.documentId,
      merchantName: row.merchantName,
      amount: rowAmount,
      date: rowDate,
      similarity: Math.round(sim * 100) / 100,
    });
  }

  duplicates.sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({ duplicates });
}
