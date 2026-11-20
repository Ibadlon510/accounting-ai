import { NextResponse } from "next/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import {
  addGroupMember,
  removeGroupMember,
  requireGroupAccess,
} from "@/lib/consolidation/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params;
  const access = await requireGroupAccess(id);
  if (access instanceof NextResponse) return access;

  const archiveBlock = await requireWritableOrg(access.group.organizationId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(
    access.group.organizationId,
    "accountant"
  );
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const organizationId =
    typeof body.organizationId === "string" ? body.organizationId.trim() : "";
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const group = await addGroupMember({
      groupId: id,
      organizationId,
      userId: access.userId,
    });
    return NextResponse.json({ group });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to add member";
    const status = msg.includes("role") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const { id } = await context.params;
  const access = await requireGroupAccess(id);
  if (access instanceof NextResponse) return access;

  const archiveBlock = await requireWritableOrg(access.group.organizationId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(
    access.group.organizationId,
    "accountant"
  );
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get("organizationId")?.trim() ?? "";

  if (!organizationId) {
    try {
      const body = await request.json();
      if (typeof body.organizationId === "string") {
        organizationId = body.organizationId.trim();
      }
    } catch {
      // optional body
    }
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const group = await removeGroupMember(
      id,
      organizationId,
      access.group.organizationId
    );
    return NextResponse.json({ group });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to remove member";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
