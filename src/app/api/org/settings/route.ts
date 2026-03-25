import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        currency: organizations.currency,
        taxRegistrationNumber: organizations.taxRegistrationNumber,
        fiscalYearStart: organizations.fiscalYearStart,
        subscriptionPlan: organizations.subscriptionPlan,
        address: organizations.address,
        phone: organizations.phone,
        email: organizations.email,
        logoUrl: organizations.logoUrl,
        emailFromName: organizations.emailFromName,
        emailReplyTo: organizations.emailReplyTo,
        emailSignatureHtml: organizations.emailSignatureHtml,
        emailDefaultCc: organizations.emailDefaultCc,
        autoSendOnInvoiceConfirm: organizations.autoSendOnInvoiceConfirm,
        autoSendOnPaymentReceipt: organizations.autoSendOnPaymentReceipt,
        isVatRegistered: organizations.isVatRegistered,
        taxLabel: organizations.taxLabel,
        defaultTaxCodeId: organizations.defaultTaxCodeId,
        numberFormat: organizations.numberFormat,
        dateFormat: organizations.dateFormat,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (e: unknown) {
    console.error("[org/settings GET] Error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  const stringFields = [
    "name", "currency", "taxRegistrationNumber", "address", "phone", "email",
    "emailFromName", "emailReplyTo", "emailSignatureHtml", "emailDefaultCc",
    "numberFormat", "dateFormat",
  ] as const;

  for (const key of stringFields) {
    if (body[key] !== undefined) {
      const val = typeof body[key] === "string" ? (body[key] as string).trim() : body[key];
      if (key === "name" || key === "currency" || key === "numberFormat" || key === "dateFormat") {
        if (val) updates[key] = val;
      } else {
        updates[key] = val || null;
      }
    }
  }

  if (body.fiscalYearStart != null)
    updates.fiscalYearStart = body.fiscalYearStart;
  if (body.autoSendOnInvoiceConfirm !== undefined)
    updates.autoSendOnInvoiceConfirm = body.autoSendOnInvoiceConfirm;
  if (body.autoSendOnPaymentReceipt !== undefined)
    updates.autoSendOnPaymentReceipt = body.autoSendOnPaymentReceipt;
  if (body.isVatRegistered !== undefined)
    updates.isVatRegistered = !!body.isVatRegistered;
  if (body.taxLabel !== undefined) {
    const label = typeof body.taxLabel === "string" ? body.taxLabel.trim() : "";
    updates.taxLabel = label || "VAT";
  }
  if (body.defaultTaxCodeId !== undefined)
    updates.defaultTaxCodeId = body.defaultTaxCodeId || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[org/settings PATCH] Error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
