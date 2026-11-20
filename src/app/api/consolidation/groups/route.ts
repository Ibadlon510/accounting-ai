import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import {
  createGroup,
  listGroupsForOrg,
} from "@/lib/consolidation/service";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groups = await listGroupsForOrg(orgId, session.user.id);
    return NextResponse.json({ groups });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load groups";
    console.error("GET /api/consolidation/groups", e);
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const memberOrganizationIds = Array.isArray(body.memberOrganizationIds)
    ? body.memberOrganizationIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0
      )
    : [];

  try {
    const group = await createGroup({
      organizationId: orgId,
      name,
      description:
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
      createdBy: roleCheck.userId,
      memberOrganizationIds,
    });
    return NextResponse.json({ group }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create group";
    const status = msg.includes("role") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
