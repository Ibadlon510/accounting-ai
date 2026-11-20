import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/utils/rate-limit";
import { resolvePortalToken, getPortalInvoice } from "@/lib/client-portal/tokens";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const ip = getClientIp(request);
  if (!rateLimit(`portal-invoice:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token, id } = await params;
  const resolved = await resolvePortalToken(token);
  if (!resolved) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 401 });
  }

  const invoice = await getPortalInvoice(
    resolved.organizationId,
    resolved.customerId,
    id
  );
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({
    organization: {
      name: resolved.orgName,
      currency: resolved.orgCurrency,
    },
    invoice,
  });
}
