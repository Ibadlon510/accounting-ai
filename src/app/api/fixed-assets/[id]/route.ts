import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { depreciationSchedules, fixedAssets } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireWritableOrg } from "@/lib/billing/gates";
import { mapFixedAsset } from "@/lib/fixed-assets/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const [row] = await db
      .select()
      .from(fixedAssets)
      .where(and(eq(fixedAssets.id, id), eq(fixedAssets.organizationId, orgId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const schedule = await db
      .select()
      .from(depreciationSchedules)
      .where(
        and(
          eq(depreciationSchedules.organizationId, orgId),
          eq(depreciationSchedules.fixedAssetId, id)
        )
      )
      .orderBy(
        sql`${depreciationSchedules.periodYear} asc`,
        sql`${depreciationSchedules.periodMonth} asc`
      );

    return NextResponse.json({
      asset: mapFixedAsset(row),
      schedule: schedule.map((s) => ({
        id: s.id,
        periodYear: s.periodYear,
        periodMonth: s.periodMonth,
        period: `${s.periodYear}-${String(s.periodMonth).padStart(2, "0")}`,
        amount: parseFloat(s.amount),
        accumulatedAfter: parseFloat(s.accumulatedAfter),
        bookValueAfter: parseFloat(s.bookValueAfter),
        journalEntryId: s.journalEntryId,
        depreciationRunId: s.depreciationRunId,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(fixedAssets)
      .where(and(eq(fixedAssets.id, id), eq(fixedAssets.organizationId, orgId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    if (existing.status === "disposed") {
      return NextResponse.json(
        { error: "Disposed assets cannot be edited. Ledger entries can only be reversed." },
        { status: 400 }
      );
    }

    const hasDep = parseFloat(existing.accumulatedDepreciation ?? "0") > 0;
    if (
      hasDep &&
      (body.cost != null ||
        body.salvageValue != null ||
        body.usefulLifeMonths != null ||
        body.acquisitionDate != null ||
        body.assetAccountId != null)
    ) {
      return NextResponse.json(
        {
          error:
            "Cost, life, and account fields cannot change after depreciation has posted. Reverse the related journals if correction is needed.",
        },
        { status: 400 }
      );
    }

    const updates: Partial<typeof fixedAssets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.description === "string") {
      updates.description = body.description.trim() || null;
    }
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
    if (typeof body.category === "string" && body.category.trim()) {
      updates.category = body.category.trim().toLowerCase();
    }
    if (typeof body.isActive === "boolean" && existing.status !== "disposed") {
      updates.isActive = body.isActive;
    }

    if (!hasDep) {
      if (typeof body.acquisitionDate === "string" && body.acquisitionDate) {
        updates.acquisitionDate = body.acquisitionDate;
      }
      if (body.cost != null) {
        const cost = Number(body.cost);
        if (!Number.isFinite(cost) || cost <= 0) {
          return NextResponse.json({ error: "Invalid cost" }, { status: 400 });
        }
        updates.cost = cost.toFixed(2);
      }
      if (body.salvageValue != null) {
        const salvage = Number(body.salvageValue);
        if (!Number.isFinite(salvage) || salvage < 0) {
          return NextResponse.json({ error: "Invalid salvage value" }, { status: 400 });
        }
        updates.salvageValue = salvage.toFixed(2);
      }
      if (body.usefulLifeMonths != null) {
        const life = Number(body.usefulLifeMonths);
        if (!Number.isFinite(life) || life < 1) {
          return NextResponse.json({ error: "Invalid useful life" }, { status: 400 });
        }
        updates.usefulLifeMonths = Math.floor(life);
      }
      if (typeof body.assetAccountId === "string" && body.assetAccountId) {
        updates.assetAccountId = body.assetAccountId;
      }
      if (typeof body.accumDepAccountId === "string" && body.accumDepAccountId) {
        updates.accumDepAccountId = body.accumDepAccountId;
      }
      if (typeof body.depExpenseAccountId === "string" && body.depExpenseAccountId) {
        updates.depExpenseAccountId = body.depExpenseAccountId;
      }
    }

    const [updated] = await db
      .update(fixedAssets)
      .set(updates)
      .where(and(eq(fixedAssets.id, id), eq(fixedAssets.organizationId, orgId)))
      .returning();

    return NextResponse.json({ asset: mapFixedAsset(updated!) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const { id } = await ctx.params;

  try {
    const [existing] = await db
      .select()
      .from(fixedAssets)
      .where(and(eq(fixedAssets.id, id), eq(fixedAssets.organizationId, orgId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    if (
      existing.status === "disposed" ||
      parseFloat(existing.accumulatedDepreciation ?? "0") > 0 ||
      existing.capitalizationJournalEntryId
    ) {
      return NextResponse.json(
        {
          error:
            "Assets with ledger postings cannot be deleted. Deactivate the register row or reverse related journals.",
        },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(fixedAssets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(fixedAssets.id, id), eq(fixedAssets.organizationId, orgId)))
      .returning();

    return NextResponse.json({ asset: mapFixedAsset(updated!) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to deactivate asset";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
