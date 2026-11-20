import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/utils/rate-limit";
import {
  resolvePortalToken,
  buildCustomerStatement,
} from "@/lib/client-portal/tokens";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  if (!rateLimit(`portal-statement:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;
  const resolved = await resolvePortalToken(token);
  if (!resolved) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 401 });
  }

  const statement = await buildCustomerStatement(
    resolved.organizationId,
    resolved.customerId
  );
  if (!statement) {
    return NextResponse.json({ error: "Customer not available" }, { status: 404 });
  }

  return NextResponse.json({
    organization: {
      name: resolved.orgName,
      currency: resolved.orgCurrency,
    },
    statement,
  });
}
