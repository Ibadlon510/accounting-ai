import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import { exchangeRates, organizations } from "@/lib/db/schema";
import { COMMON_CURRENCIES, normalizeCurrency } from "@/lib/accounting/currencies";

const upsertSchema = z.object({
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3).optional(),
  rate: z.number().positive(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  id: z.string().uuid().optional(),
});

function serializeRate(row: typeof exchangeRates.$inferSelect) {
  return {
    id: row.id,
    fromCurrency: row.fromCurrency,
    toCurrency: row.toCurrency,
    rate: parseFloat(row.rate),
    effectiveDate: row.effectiveDate,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.toUpperCase();
    const to = searchParams.get("to")?.toUpperCase();

    const [org] = await db
      .select({ currency: organizations.currency })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const baseCurrency = normalizeCurrency(org?.currency);

    const conditions = [eq(exchangeRates.organizationId, orgId)];
    if (from) conditions.push(eq(exchangeRates.fromCurrency, from));
    if (to) conditions.push(eq(exchangeRates.toCurrency, to));

    const rows = await db
      .select()
      .from(exchangeRates)
      .where(and(...conditions))
      .orderBy(desc(exchangeRates.effectiveDate), desc(exchangeRates.createdAt));

    return NextResponse.json({
      baseCurrency,
      currencies: COMMON_CURRENCIES,
      rates: rows.map(serializeRate),
    });
  } catch (e) {
    console.error("[org/exchange-rates GET] Error:", e);
    return NextResponse.json({ error: "Failed to load exchange rates" }, { status: 500 });
  }
}

/** Upsert: create a new rate, or update by id / by (from,to,effectiveDate). */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleCheck = await requireOrgRole(orgId, "accountant");
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fromCurrency = normalizeCurrency(parsed.data.fromCurrency);
    const [org] = await db
      .select({ currency: organizations.currency })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    const baseCurrency = normalizeCurrency(org?.currency);
    const toCurrency = normalizeCurrency(parsed.data.toCurrency ?? baseCurrency);

    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        { error: "From and to currencies must differ (base currency rate is always 1)" },
        { status: 400 }
      );
    }

    const rateStr = parsed.data.rate.toFixed(8);
    const { effectiveDate, id } = parsed.data;

    if (id) {
      const [existing] = await db
        .select({ id: exchangeRates.id })
        .from(exchangeRates)
        .where(and(eq(exchangeRates.id, id), eq(exchangeRates.organizationId, orgId)))
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 });
      }
      const [updated] = await db
        .update(exchangeRates)
        .set({
          fromCurrency,
          toCurrency,
          rate: rateStr,
          effectiveDate,
        })
        .where(and(eq(exchangeRates.id, id), eq(exchangeRates.organizationId, orgId)))
        .returning();
      return NextResponse.json({ rate: serializeRate(updated) });
    }

    const [sameKey] = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.organizationId, orgId),
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency),
          eq(exchangeRates.effectiveDate, effectiveDate)
        )
      )
      .limit(1);

    if (sameKey) {
      const [updated] = await db
        .update(exchangeRates)
        .set({ rate: rateStr })
        .where(and(eq(exchangeRates.id, sameKey.id), eq(exchangeRates.organizationId, orgId)))
        .returning();
      return NextResponse.json({ rate: serializeRate(updated) });
    }

    const [created] = await db
      .insert(exchangeRates)
      .values({
        organizationId: orgId,
        fromCurrency,
        toCurrency,
        rate: rateStr,
        effectiveDate,
      })
      .returning();

    return NextResponse.json({ rate: serializeRate(created) }, { status: 201 });
  } catch (e) {
    console.error("[org/exchange-rates POST] Error:", e);
    return NextResponse.json({ error: "Failed to save exchange rate" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleCheck = await requireOrgRole(orgId, "accountant");
    if (roleCheck instanceof NextResponse) return roleCheck;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: exchangeRates.id })
      .from(exchangeRates)
      .where(and(eq(exchangeRates.id, id), eq(exchangeRates.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Exchange rate not found" }, { status: 404 });
    }

    await db
      .delete(exchangeRates)
      .where(and(eq(exchangeRates.id, id), eq(exchangeRates.organizationId, orgId)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[org/exchange-rates DELETE] Error:", e);
    return NextResponse.json({ error: "Failed to delete exchange rate" }, { status: 500 });
  }
}
