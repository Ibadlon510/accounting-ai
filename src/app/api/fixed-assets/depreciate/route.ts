import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  listDepreciationRuns,
  runDepreciation,
} from "@/lib/fixed-assets/service";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const runs = await listDepreciationRuns(orgId);
    return NextResponse.json({ runs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load depreciation runs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const periodYear = Number(body.periodYear);
  const periodMonth = Number(body.periodMonth);

  if (!Number.isInteger(periodYear) || periodYear < 2000 || periodYear > 2100) {
    return NextResponse.json({ error: "Valid periodYear is required" }, { status: 400 });
  }
  if (!Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
    return NextResponse.json({ error: "periodMonth must be 1–12" }, { status: 400 });
  }

  try {
    const result = await runDepreciation({
      organizationId: orgId,
      periodYear,
      periodMonth,
    });

    return NextResponse.json({
      run: {
        id: result.runId,
        periodYear,
        periodMonth,
        period: `${periodYear}-${String(periodMonth).padStart(2, "0")}`,
        totalAmount: result.totalAmount,
        assetCount: result.assetCount,
        journalEntryId: result.journalEntryId,
        entryNumber: result.entryNumber,
      },
      note: "Depreciation journal posted. Entries can only be reversed, not edited or deleted.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to run depreciation";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
