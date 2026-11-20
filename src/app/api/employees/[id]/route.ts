import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireWritableOrg } from "@/lib/billing/gates";

function mapEmployee(row: typeof employees.$inferSelect) {
  return {
    id: row.id,
    employeeNumber: row.employeeNumber,
    name: row.name,
    email: row.email,
    phone: row.phone,
    position: row.position,
    department: row.department,
    joinDate: row.joinDate,
    basicSalary: parseFloat(row.basicSalary ?? "0"),
    housingAllowance: parseFloat(row.housingAllowance ?? "0"),
    transportAllowance: parseFloat(row.transportAllowance ?? "0"),
    labourCardNumber: row.labourCardNumber,
    iban: row.iban,
    bankRoutingCode: row.bankRoutingCode,
    isActive: row.isActive,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const [row] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ employee: mapEmployee(row) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const num = (v: unknown) => {
    if (v === null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return String(Number(v));
    return undefined;
  };

  const updates: Partial<typeof employees.$inferInsert> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    updates.name = name;
  }
  if (typeof body.employeeNumber === "string") updates.employeeNumber = body.employeeNumber.trim() || null;
  if (typeof body.email === "string") updates.email = body.email.trim() || null;
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.position === "string") updates.position = body.position.trim() || null;
  if (typeof body.department === "string") updates.department = body.department.trim() || null;
  if (typeof body.joinDate === "string") updates.joinDate = body.joinDate || null;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  const basic = num(body.basicSalary);
  if (basic !== undefined) updates.basicSalary = basic;
  const housing = num(body.housingAllowance);
  if (housing !== undefined) updates.housingAllowance = housing;
  const transport = num(body.transportAllowance);
  if (transport !== undefined) updates.transportAllowance = transport;

  if (typeof body.labourCardNumber === "string") {
    updates.labourCardNumber = body.labourCardNumber.trim() || null;
  }
  if (typeof body.iban === "string") {
    updates.iban = body.iban.trim().replace(/\s+/g, "") || null;
  }
  if (typeof body.bankRoutingCode === "string") {
    updates.bankRoutingCode = body.bankRoutingCode.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(employees)
      .set(updates)
      .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ employee: mapEmployee(updated) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const { id } = await params;
  try {
    // Soft-deactivate — keep history for payroll/journal references
    const [updated] = await db
      .update(employees)
      .set({ isActive: false })
      .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ employee: mapEmployee(updated) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to deactivate employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
