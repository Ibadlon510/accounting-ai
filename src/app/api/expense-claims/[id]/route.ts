import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getClaimWithLines } from "@/lib/expense-claims/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const claim = await getClaimWithLines(orgId, id);
    if (!claim) {
      return NextResponse.json({ error: "Expense claim not found" }, { status: 404 });
    }
    return NextResponse.json({ claim });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load claim";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
