import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { buildVat201Report, VAT201_QUARTER_MAP } from "@/lib/vat";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const quarter = searchParams.get("quarter") ?? "Q1-2026";

  if (!VAT201_QUARTER_MAP[quarter]) {
    return NextResponse.json(
      { error: "Invalid quarter. Use e.g. Q3-2025" },
      { status: 400 }
    );
  }

  try {
    const report = await buildVat201Report(orgId, quarter);
    if ("error" in report) {
      return NextResponse.json({ error: report.error }, { status: report.status });
    }
    return NextResponse.json(report);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to build VAT 201 report";
    console.error("VAT 201 error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
