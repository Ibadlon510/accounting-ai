import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { seedDemoData, SEED_MODULE_IDS, type SeedModuleId } from "@/lib/db/seed";

const ALLOWED_MODULES = new Set<string>(SEED_MODULE_IDS);

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

export async function DELETE() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { removeDemoData } = await import("@/lib/db/seed");
    await removeDemoData(orgId);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to remove demo data";
    console.error("removeDemoData error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
