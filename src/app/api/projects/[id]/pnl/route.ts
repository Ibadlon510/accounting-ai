import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { AccountingError } from "@/lib/accounting/engine";
import { getProjectPnL } from "@/lib/projects/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const report = await getProjectPnL(orgId, id, { from, to });
    return NextResponse.json(report);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load project P&L";
    if (msg === "Project not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
