import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  contactCredits,
  creditApplications,
  invoices,
  bills,
} from "@/lib/db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactType = searchParams.get("contactType");
  const contactId = searchParams.get("contactId");

  if (!contactType || !contactId) {
    return NextResponse.json({ error: "contactType and contactId are required" }, { status: 400 });
  }

  try {
    const credits = await db
      .select()
      .from(contactCredits)
      .where(
        and(
          eq(contactCredits.organizationId, orgId),
          eq(contactCredits.contactType, contactType),
          eq(contactCredits.contactId, contactId),
          gt(contactCredits.remainingAmount, "0"),
        ),
      );

    const creditIds = credits.map((c) => c.id);
    let applications: (typeof creditApplications.$inferSelect)[] = [];
    if (creditIds.length > 0) {
      applications = await db
        .select()
        .from(creditApplications)
        .where(
          and(
            eq(creditApplications.organizationId, orgId),
            inArray(creditApplications.creditId, creditIds),
          ),
        );
    }

    const appsByCreditId = new Map<string, typeof applications>();
    for (const app of applications) {
      const list = appsByCreditId.get(app.creditId) ?? [];
      list.push(app);
      appsByCreditId.set(app.creditId, list);
    }

    return NextResponse.json({
      credits: credits.map((c) => ({
        ...c,
        originalAmount: parseFloat(c.originalAmount),
        remainingAmount: parseFloat(c.remainingAmount),
        applications: appsByCreditId.get(c.id) ?? [],
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load credits";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type ApplyCreditBody = {
  documentType: "invoice" | "bill";
  documentId: string;
  applications: { creditId: string; amount: number }[];
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getSessionUserId();

  let body: ApplyCreditBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { documentType, documentId, applications: apps } = body;
  if (!documentType || !documentId || !Array.isArray(apps) || apps.length === 0) {
    return NextResponse.json({ error: "documentType, documentId, and applications[] are required" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const table = documentType === "invoice" ? invoices : bills;

      const [doc] = await tx
        .select({
          total: table.total,
          amountPaid: table.amountPaid,
          creditApplied: table.creditApplied,
          amountDue: table.amountDue,
          status: table.status,
        })
        .from(table)
        .where(and(eq(table.id, documentId), eq(table.organizationId, orgId)))
        .limit(1);

      if (!doc) throw new Error(`${documentType} not found`);

      const totalApplicationAmount = apps.reduce((sum, a) => sum + a.amount, 0);
      const currentAmountDue = parseFloat(doc.amountDue ?? "0");

      if (totalApplicationAmount > currentAmountDue + 0.01) {
        throw new Error(`Total credit (${totalApplicationAmount}) exceeds amount due (${currentAmountDue})`);
      }

      for (const app of apps) {
        if (app.amount <= 0) throw new Error("Application amount must be positive");

        const [credit] = await tx
          .select()
          .from(contactCredits)
          .where(and(eq(contactCredits.id, app.creditId), eq(contactCredits.organizationId, orgId)))
          .limit(1);

        if (!credit) throw new Error(`Credit ${app.creditId} not found`);

        const remaining = parseFloat(credit.remainingAmount);
        if (app.amount > remaining + 0.01) {
          throw new Error(`Application amount (${app.amount}) exceeds remaining credit (${remaining})`);
        }

        await tx.insert(creditApplications).values({
          organizationId: orgId,
          creditId: app.creditId,
          documentType,
          documentId,
          amount: String(app.amount),
          appliedBy: userId,
        });

        await tx
          .update(contactCredits)
          .set({ remainingAmount: String(Math.max(0, remaining - app.amount)) })
          .where(eq(contactCredits.id, app.creditId));
      }

      const total = parseFloat(doc.total ?? "0");
      const amountPaid = parseFloat(doc.amountPaid ?? "0");
      const newCreditApplied = parseFloat(doc.creditApplied ?? "0") + totalApplicationAmount;
      const newAmountDue = Math.max(0, total - amountPaid - newCreditApplied);
      const newStatus = newAmountDue <= 0.01 ? "paid" : "partial";

      await tx
        .update(table)
        .set({
          creditApplied: String(newCreditApplied),
          amountDue: String(newAmountDue),
          status: newStatus,
        })
        .where(eq(table.id, documentId));

      return { ok: true, newAmountDue, newStatus };
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to apply credits";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
