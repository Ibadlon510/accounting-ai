import { NextResponse } from "next/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import {
  deleteGroup,
  requireGroupAccess,
  updateGroup,
} from "@/lib/consolidation/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  const access = await requireGroupAccess(id);
  if (access instanceof NextResponse) return access;

  return NextResponse.json({ group: access.group });
}

export async function PATCH(request: Request, context: Ctx) {
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

  const patch: { name?: string; description?: string | null } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.description === null) {
    patch.description = null;
  } else if (typeof body.description === "string") {
    patch.description = body.description.trim() || null;
  }

  try {
    const group = await updateGroup(id, patch);
    return NextResponse.json({ group });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update group";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
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

  try {
    await deleteGroup(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete group";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
