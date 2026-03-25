import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getEntityConfig } from "@/lib/import-export/configs";
import { validateCSV } from "@/lib/import-export/engine/validator";
import { MAX_FILE_SIZE } from "@/lib/import-export/types";

export async function POST(
  request: Request,
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  const csvText = await file.text();
  const result = await validateCSV(csvText, config, orgId);

  return NextResponse.json(result);
}
