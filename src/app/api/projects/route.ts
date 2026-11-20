import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  createProject,
  listProjects,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/projects/service";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projects = await listProjects(orgId);
    return NextResponse.json({ projects });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load projects";
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

  const kind: ProjectKind =
    body.kind === "cost_centre" ? "cost_centre" : "project";
  const status: ProjectStatus =
    body.status === "completed" || body.status === "archived"
      ? body.status
      : "active";

  try {
    const project = await createProject({
      organizationId: orgId,
      name,
      code: typeof body.code === "string" ? body.code : null,
      kind,
      status,
      startDate:
        typeof body.startDate === "string" && body.startDate
          ? body.startDate
          : null,
      endDate:
        typeof body.endDate === "string" && body.endDate ? body.endDate : null,
      description:
        typeof body.description === "string" ? body.description.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      createdBy: roleCheck.userId,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create project";
    const statusCode = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
}
