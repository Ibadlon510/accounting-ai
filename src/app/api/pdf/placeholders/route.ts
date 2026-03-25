import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getPlaceholderRegistry } from "@/lib/pdf/placeholders";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType") ?? undefined;
    const registry = getPlaceholderRegistry(documentType);

    return NextResponse.json(registry);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load placeholders";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
