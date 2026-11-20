import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  deleteProject,
  getProject,
  updateProject,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/projects/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const project = await getProject(orgId, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let kind: ProjectKind | undefined;
  if (body.kind === "project" || body.kind === "cost_centre") kind = body.kind;

  let status: ProjectStatus | undefined;
  if (
    body.status === "active" ||
    body.status === "completed" ||
    body.status === "archived"
  ) {
    status = body.status;
  }

  try {
    const project = await updateProject(orgId, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      code:
        body.code === null
          ? null
          : typeof body.code === "string"
            ? body.code
            : undefined,
      kind,
      status,
      startDate:
        body.startDate === null
          ? null
          : typeof body.startDate === "string"
            ? body.startDate
            : undefined,
      endDate:
        body.endDate === null
          ? null
          : typeof body.endDate === "string"
            ? body.endDate
            : undefined,
      description:
        body.description === null
          ? null
          : typeof body.description === "string"
            ? body.description
            : undefined,
      notes:
        body.notes === null
          ? null
          : typeof body.notes === "string"
            ? body.notes
            : undefined,
    });

    return NextResponse.json({ project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update project";
    const statusCode = e instanceof AccountingError ? 400 : 500;
    if (msg === "Project not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  try {
    const result = await deleteProject(orgId, id);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete project";
    const statusCode = e instanceof AccountingError ? 400 : 500;
    if (msg === "Project not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
}
