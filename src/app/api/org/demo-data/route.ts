import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";

export async function POST() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { seedDemoData } = await import("@/lib/db/seed");
    await seedDemoData(orgId);
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
