import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { seedDemoData, SEED_MODULE_IDS, type SeedModuleId } from "@/lib/db/seed";
import { db } from "@/lib/db";
import { customers, suppliers, invoices, bills, items, bankAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const ALLOWED_MODULES = new Set<string>(SEED_MODULE_IDS);

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [cust, supp, inv, bl, itm, bank] = await Promise.all([
      db.select({ id: customers.id }).from(customers).where(and(eq(customers.organizationId, orgId), eq(customers.isDemo, true))).limit(1),
      db.select({ id: suppliers.id }).from(suppliers).where(and(eq(suppliers.organizationId, orgId), eq(suppliers.isDemo, true))).limit(1),
      db.select({ id: invoices.id }).from(invoices).where(and(eq(invoices.organizationId, orgId), eq(invoices.isDemo, true))).limit(1),
      db.select({ id: bills.id }).from(bills).where(and(eq(bills.organizationId, orgId), eq(bills.isDemo, true))).limit(1),
      db.select({ id: items.id }).from(items).where(and(eq(items.organizationId, orgId), eq(items.isDemo, true))).limit(1),
      db.select({ id: bankAccounts.id }).from(bankAccounts).where(and(eq(bankAccounts.organizationId, orgId), eq(bankAccounts.isDemo, true))).limit(1),
    ]);
    const hasDemoData = cust.length > 0 || supp.length > 0 || inv.length > 0 || bl.length > 0 || itm.length > 0 || bank.length > 0;
    return NextResponse.json({ hasDemoData });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to check demo data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let options: { modules?: SeedModuleId[] } | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    const raw = body?.modules;
    if (Array.isArray(raw)) {
      const validated = raw
        .filter((m: unknown) => typeof m === "string" && ALLOWED_MODULES.has(String(m).toLowerCase()))
        .map((m: string) => m.toLowerCase() as SeedModuleId);
      if (validated.length > 0) {
        options = { modules: validated };
      } else {
        return NextResponse.json(
          { error: "Select at least one module to seed" },
          { status: 400 }
        );
      }
    }
  } catch {
    // ignore parse errors; seed all modules
  }

  try {
    await seedDemoData(orgId, options);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to seed demo data";
    console.error("seedDemoData error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const demoOnly = searchParams.get("demoOnly") === "true";

  try {
    if (demoOnly) {
      const { removeDemoDataOnly } = await import("@/lib/db/seed");
      await removeDemoDataOnly(orgId);
      return NextResponse.json({ ok: true });
    } else {
      const { removeDemoData } = await import("@/lib/db/seed");
      await removeDemoData(orgId);
      return NextResponse.json({ ok: true });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to remove data";
    console.error("removeDemoData error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
