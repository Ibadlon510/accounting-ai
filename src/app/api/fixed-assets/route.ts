import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { fixedAssets } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireWritableOrg } from "@/lib/billing/gates";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";
import { AccountingError } from "@/lib/accounting/engine";
import {
  mapFixedAsset,
  nextAssetNumber,
  resolveDefaultFaAccounts,
} from "@/lib/fixed-assets/service";
import { roundMoney } from "@/lib/fixed-assets/accounts";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.organizationId, orgId))
      .orderBy(sql`${fixedAssets.assetNumber} asc`);

    return NextResponse.json({ assets: rows.map(mapFixedAsset) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load fixed assets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const acquisitionDate =
    typeof body.acquisitionDate === "string" && body.acquisitionDate
      ? body.acquisitionDate
      : null;
  if (!acquisitionDate) {
    return NextResponse.json({ error: "Acquisition date is required" }, { status: 400 });
  }

  const cost = Number(body.cost);
  if (!Number.isFinite(cost) || cost <= 0) {
    return NextResponse.json({ error: "Cost must be a positive number" }, { status: 400 });
  }

  const usefulLifeMonths = Number(body.usefulLifeMonths);
  if (!Number.isFinite(usefulLifeMonths) || usefulLifeMonths < 1) {
    return NextResponse.json(
      { error: "Useful life (months) must be at least 1" },
      { status: 400 }
    );
  }

  const salvageValue = Number(body.salvageValue ?? 0);
  if (!Number.isFinite(salvageValue) || salvageValue < 0 || salvageValue >= cost) {
    return NextResponse.json(
      { error: "Salvage value must be ≥ 0 and less than cost" },
      { status: 400 }
    );
  }

  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim().toLowerCase()
      : "equipment";

  const capitalize = body.capitalize !== false;
  const creditAccountId =
    typeof body.creditAccountId === "string" ? body.creditAccountId : null;

  try {
    const defaults = await resolveDefaultFaAccounts(orgId, category);
    const assetAccountId =
      typeof body.assetAccountId === "string" && body.assetAccountId
        ? body.assetAccountId
        : defaults.assetAccountId;
    const accumDepAccountId =
      typeof body.accumDepAccountId === "string" && body.accumDepAccountId
        ? body.accumDepAccountId
        : defaults.accumDepAccountId;
    const depExpenseAccountId =
      typeof body.depExpenseAccountId === "string" && body.depExpenseAccountId
        ? body.depExpenseAccountId
        : defaults.depExpenseAccountId;

    if (capitalize && !creditAccountId) {
      return NextResponse.json(
        {
          error:
            "creditAccountId is required when capitalizing (bank or payable account to credit)",
        },
        { status: 400 }
      );
    }

    const assetNumber =
      typeof body.assetNumber === "string" && body.assetNumber.trim()
        ? body.assetNumber.trim().toUpperCase()
        : await nextAssetNumber(orgId);

    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(fixedAssets)
        .values({
          organizationId: orgId,
          assetNumber,
          name,
          description:
            typeof body.description === "string" ? body.description.trim() || null : null,
          category,
          assetAccountId,
          accumDepAccountId,
          depExpenseAccountId,
          acquisitionDate,
          cost: roundMoney(cost).toFixed(2),
          salvageValue: roundMoney(salvageValue).toFixed(2),
          usefulLifeMonths: Math.floor(usefulLifeMonths),
          depreciationMethod: "straight_line",
          status: "active",
          accumulatedDepreciation: "0",
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          isActive: true,
        })
        .returning();

      if (!row) throw new AccountingError("Failed to create asset");

      if (capitalize && creditAccountId) {
        const posted = await postJournalEntry({
          organizationId: orgId,
          entryDate: acquisitionDate,
          description: `Capitalize ${assetNumber} — ${name}`,
          reference: assetNumber,
          sourceType: "fixed_asset",
          sourceId: row.id,
          lines: [
            {
              accountId: assetAccountId,
              description: name,
              debit: roundMoney(cost),
              credit: 0,
            },
            {
              accountId: creditAccountId,
              description: `Capitalization — ${assetNumber}`,
              debit: 0,
              credit: roundMoney(cost),
            },
          ],
          tx,
        });

        const [updated] = await tx
          .update(fixedAssets)
          .set({
            capitalizationJournalEntryId: posted.journalEntryId,
            updatedAt: new Date(),
          })
          .where(eq(fixedAssets.id, row.id))
          .returning();

        return updated ?? row;
      }

      return row;
    });

    return NextResponse.json({ asset: mapFixedAsset(created) }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create fixed asset";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
