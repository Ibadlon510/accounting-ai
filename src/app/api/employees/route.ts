import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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
    isActive: row.isActive,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  };
}

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.organizationId, orgId))
      .orderBy(sql`${employees.name} asc`);

    return NextResponse.json({ employees: rows.map(mapEmployee) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load employees";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const num = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return String(Number(v));
    return null;
  };

  try {
    const [created] = await db
      .insert(employees)
      .values({
        organizationId: orgId,
        name,
        employeeNumber:
          typeof body.employeeNumber === "string" ? body.employeeNumber.trim() || null : null,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        position: typeof body.position === "string" ? body.position.trim() || null : null,
        department: typeof body.department === "string" ? body.department.trim() || null : null,
        joinDate: typeof body.joinDate === "string" && body.joinDate ? body.joinDate : null,
        basicSalary: num(body.basicSalary),
        housingAllowance: num(body.housingAllowance),
        transportAllowance: num(body.transportAllowance),
        isActive: body.isActive === false ? false : true,
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }

    return NextResponse.json({ employee: mapEmployee(created) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
