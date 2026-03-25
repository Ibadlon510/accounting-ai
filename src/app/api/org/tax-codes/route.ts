import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { taxCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireOrgRole } from "@/lib/auth/require-role";

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
  type: z.enum(["output", "input", "exempt", "zero", "reverse_charge"]),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  rate: z.number().min(0).max(100).optional(),
  type: z.enum(["output", "input", "exempt", "zero", "reverse_charge"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await db
      .select()
      .from(taxCodes)
      .where(eq(taxCodes.organizationId, orgId))
      .orderBy(taxCodes.code);

    return NextResponse.json({ taxCodes: codes });
  } catch (e) {
    console.error("[tax-codes] GET error:", e);
    return NextResponse.json({ error: "Failed to fetch tax codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleCheck = await requireOrgRole(orgId, "admin");
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, name, rate, type } = parsed.data;

    const [existing] = await db
      .select({ id: taxCodes.id })
      .from(taxCodes)
      .where(and(eq(taxCodes.organizationId, orgId), eq(taxCodes.code, code)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Tax code "${code}" already exists for this organization` },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(taxCodes)
      .values({
        organizationId: orgId,
        code,
        name,
        rate: rate.toFixed(2),
        type,
      })
      .returning();

    return NextResponse.json({ taxCode: created }, { status: 201 });
  } catch (e) {
    console.error("[tax-codes] POST error:", e);
    return NextResponse.json({ error: "Failed to create tax code" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleCheck = await requireOrgRole(orgId, "admin");
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    const [existing] = await db
      .select({ id: taxCodes.id })
      .from(taxCodes)
      .where(and(eq(taxCodes.id, id), eq(taxCodes.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Tax code not found" }, { status: 404 });
    }

    const setValues: Record<string, unknown> = {};
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.rate !== undefined) setValues.rate = updates.rate.toFixed(2);
    if (updates.type !== undefined) setValues.type = updates.type;
    if (updates.isActive !== undefined) setValues.isActive = updates.isActive;

    if (Object.keys(setValues).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(taxCodes)
      .set(setValues)
      .where(and(eq(taxCodes.id, id), eq(taxCodes.organizationId, orgId)))
      .returning();

    return NextResponse.json({ taxCode: updated });
  } catch (e) {
    console.error("[tax-codes] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update tax code" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleCheck = await requireOrgRole(orgId, "admin");
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: taxCodes.id })
      .from(taxCodes)
      .where(and(eq(taxCodes.id, id), eq(taxCodes.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Tax code not found" }, { status: 404 });
    }

    await db
      .update(taxCodes)
      .set({ isActive: false })
      .where(and(eq(taxCodes.id, id), eq(taxCodes.organizationId, orgId)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tax-codes] DELETE error:", e);
    return NextResponse.json({ error: "Failed to deactivate tax code" }, { status: 500 });
  }
}
