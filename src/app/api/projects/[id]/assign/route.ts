import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  assignProjectToActivity,
  type AssignTargetType,
} from "@/lib/projects/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id: projectId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type;
  const targetId = typeof body.id === "string" ? body.id : "";
  if (
    type !== "invoice" &&
    type !== "bill" &&
    type !== "journal_line"
  ) {
    return NextResponse.json(
      { error: "type must be invoice, bill, or journal_line" },
      { status: 400 }
    );
  }
  if (!targetId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await assignProjectToActivity(
      orgId,
      projectId,
      type as AssignTargetType,
      targetId
    );
    return NextResponse.json({ assignment: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to assign project";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Project not found" || msg.endsWith("not found")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status });
  }
}
