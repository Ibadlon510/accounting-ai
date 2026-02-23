import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const allowedStatuses = ["draft", "sent", "paid", "partial", "overdue", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(invoices)
      .set({ status })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)))
      .returning({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
      });

    return NextResponse.json({ invoice: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update invoice";
    console.error("Invoice PATCH error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
