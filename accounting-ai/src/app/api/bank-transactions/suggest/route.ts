import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { suggestGL } from "@/lib/ai/classifier";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { description: string; amount?: number; merchant?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    );
  }

  const result = await suggestGL(
    orgId,
    description,
    body.amount,
    typeof body.merchant === "string" ? body.merchant.trim() : undefined
  );

  if (!result) {
    return NextResponse.json({
      suggestedGlAccountId: null,
      suggestedGlCode: null,
      suggestedGlName: null,
      confidence: 0,
    });
  }

  return NextResponse.json({
    suggestedGlAccountId: result.glAccountId,
    suggestedGlCode: result.glCode,
    suggestedGlName: result.glName,
    confidence: result.confidence,
  });
}
