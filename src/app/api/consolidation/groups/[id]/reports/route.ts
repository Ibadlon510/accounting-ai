import { NextResponse } from "next/server";
import {
  generateConsolidatedReports,
  requireGroupAccess,
} from "@/lib/consolidation/service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Generate consolidated trial balance / P&L / balance sheet for a group.
 * Read-only — archived member orgs are included. Eliminations are stubbed.
 */
export async function GET(request: Request, context: Ctx) {
  const { id } = await context.params;
  const access = await requireGroupAccess(id);
  if (access instanceof NextResponse) return access;

  if (access.group.members.length === 0) {
    return NextResponse.json(
      { error: "Group has no member companies" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const reports = await generateConsolidatedReports({
      group: access.group,
      from,
      to,
    });
    return NextResponse.json({
      group: {
        id: access.group.id,
        name: access.group.name,
        description: access.group.description,
      },
      ...reports,
    });
  } catch (e: unknown) {
    console.error("GET /api/consolidation/groups/[id]/reports", e);
    const msg = e instanceof Error ? e.message : "Failed to generate reports";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
