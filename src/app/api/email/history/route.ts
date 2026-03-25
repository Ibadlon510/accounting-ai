import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { sentEmails } from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const documentType = params.get("documentType");
    const status = params.get("status");
    const from = params.get("from");
    const to = params.get("to");
    const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(sentEmails.organizationId, orgId)];
    if (documentType) conditions.push(eq(sentEmails.documentType, documentType));
    if (status) conditions.push(eq(sentEmails.status, status));
    if (from) conditions.push(gte(sentEmails.createdAt, new Date(from)));
    if (to) conditions.push(lte(sentEmails.createdAt, new Date(to + "T23:59:59")));

    const where = and(...conditions);

    const [emails, countResult] = await Promise.all([
      db
        .select({
          id: sentEmails.id,
          documentType: sentEmails.documentType,
          documentNumber: sentEmails.documentNumber,
          recipientEmail: sentEmails.recipientEmail,
          recipientName: sentEmails.recipientName,
          subject: sentEmails.subject,
          status: sentEmails.status,
          hasAttachment: sentEmails.hasAttachment,
          createdAt: sentEmails.createdAt,
          openedAt: sentEmails.openedAt,
        })
        .from(sentEmails)
        .where(where)
        .orderBy(desc(sentEmails.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sentEmails)
        .where(where),
    ]);

    return NextResponse.json({
      emails,
      total: Number(countResult[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load email history";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
