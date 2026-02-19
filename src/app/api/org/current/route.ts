import { NextResponse } from "next/server";
import { getCurrentOrganization } from "@/lib/org/server";

export async function GET() {
  const org = await getCurrentOrganization();
  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: org.id,
    name: org.name,
    currency: org.currency,
    subscriptionPlan: org.subscriptionPlan,
    tokenBalance: Number(org.tokenBalance ?? 0),
  });
}
