import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getEntityConfig } from "@/lib/import-export/configs";
import { generateTemplate } from "@/lib/import-export/engine/csv-generator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const config = getEntityConfig(entity);
  if (!config) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csv = generateTemplate(
    config.columns,
    config.childConfig?.childColumns
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-template.csv"`,
    },
  });
}
