import { createHash, randomBytes } from "crypto";
import { and, eq, isNull, gt, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  customerPortalTokens,
  customers,
  organizations,
  invoices,
  invoiceLines,
  payments,
} from "@/lib/db/schema";

export const DEFAULT_PORTAL_TOKEN_DAYS = 30;
export const MAX_PORTAL_TOKEN_DAYS = 365;

export function hashPortalToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateRawPortalToken(): { raw: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashPortalToken(raw),
    prefix: raw.slice(0, 8),
  };
}

export function portalShareUrl(rawToken: string, baseUrl?: string): string {
  const origin =
    baseUrl ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "";
  return `${origin.replace(/\/$/, "")}/portal/${rawToken}`;
}

export type ResolvedPortalToken = {
  id: string;
  organizationId: string;
  customerId: string;
  expiresAt: Date;
  label: string | null;
  orgName: string;
  orgCurrency: string;
  customerName: string;
  customerEmail: string | null;
};

/**
 * Resolve a raw portal token to org+customer scope.
 * Returns null for unknown, revoked, or expired tokens (no leakage).
 */
export async function resolvePortalToken(
  rawToken: string
): Promise<ResolvedPortalToken | null> {
  if (!rawToken || rawToken.length < 32 || rawToken.length > 128) return null;
  if (!/^[a-f0-9]+$/i.test(rawToken)) return null;

  const hash = hashPortalToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select({
      id: customerPortalTokens.id,
      organizationId: customerPortalTokens.organizationId,
      customerId: customerPortalTokens.customerId,
      expiresAt: customerPortalTokens.expiresAt,
      label: customerPortalTokens.label,
      orgName: organizations.name,
      orgCurrency: organizations.currency,
      customerName: customers.name,
      customerEmail: customers.email,
      customerOrgId: customers.organizationId,
      customerActive: customers.isActive,
    })
    .from(customerPortalTokens)
    .innerJoin(organizations, eq(organizations.id, customerPortalTokens.organizationId))
    .innerJoin(customers, eq(customers.id, customerPortalTokens.customerId))
    .where(
      and(
        eq(customerPortalTokens.tokenHash, hash),
        isNull(customerPortalTokens.revokedAt),
        gt(customerPortalTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!row) return null;
  // Hard scope check: customer must belong to the same org as the token
  if (row.customerOrgId !== row.organizationId) return null;
  if (!row.customerActive) return null;

  // Touch last accessed (best-effort)
  await db
    .update(customerPortalTokens)
    .set({ lastAccessedAt: now, updatedAt: now })
    .where(eq(customerPortalTokens.id, row.id))
    .catch(() => {});

  return {
    id: row.id,
    organizationId: row.organizationId,
    customerId: row.customerId,
    expiresAt: row.expiresAt,
    label: row.label,
    orgName: row.orgName,
    orgCurrency: row.orgCurrency ?? "AED",
    customerName: row.customerName,
    customerEmail: row.customerEmail,
  };
}

export async function listPortalTokensForOrg(orgId: string, customerId?: string) {
  const conditions = [eq(customerPortalTokens.organizationId, orgId)];
  if (customerId) {
    conditions.push(eq(customerPortalTokens.customerId, customerId));
  }

  const rows = await db
    .select({
      id: customerPortalTokens.id,
      customerId: customerPortalTokens.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      tokenPrefix: customerPortalTokens.tokenPrefix,
      label: customerPortalTokens.label,
      expiresAt: customerPortalTokens.expiresAt,
      revokedAt: customerPortalTokens.revokedAt,
      lastAccessedAt: customerPortalTokens.lastAccessedAt,
      createdAt: customerPortalTokens.createdAt,
      createdBy: customerPortalTokens.createdBy,
    })
    .from(customerPortalTokens)
    .innerJoin(customers, eq(customers.id, customerPortalTokens.customerId))
    .where(and(...conditions))
    .orderBy(desc(customerPortalTokens.createdAt));

  const now = Date.now();
  return rows.map((r) => {
    const revoked = !!r.revokedAt;
    const expired = r.expiresAt.getTime() <= now;
    return {
      id: r.id,
      customerId: r.customerId,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      tokenPrefix: r.tokenPrefix,
      label: r.label,
      expiresAt: r.expiresAt.toISOString(),
      revokedAt: r.revokedAt?.toISOString() ?? null,
      lastAccessedAt: r.lastAccessedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      createdBy: r.createdBy,
      status: revoked ? "revoked" : expired ? "expired" : "active",
    };
  });
}

export async function buildCustomerStatement(
  organizationId: string,
  customerId: string
) {
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      city: customers.city,
      country: customers.country,
      organizationId: customers.organizationId,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.organizationId, organizationId),
        eq(customers.isActive, true)
      )
    )
    .limit(1);

  if (!customer) return null;

  const invRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      status: invoices.status,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.customerId, customerId)
      )
    );

  const payRows = await db
    .select({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      paymentType: payments.paymentType,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.entityType, "customer"),
        eq(payments.entityId, customerId)
      )
    );

  const visible = invRows.filter((i) => i.status !== "cancelled" && i.status !== "draft");
  const invoicesList = visible.filter((i) => parseFloat(i.total ?? "0") > 0);
  const creditNotes = visible.filter(
    (i) => parseFloat(i.total ?? "0") < 0 || (i.invoiceNumber?.startsWith("CN-") ?? false)
  );
  const paymentsReceived = payRows.filter((p) => p.paymentType === "received");
  const refunds = payRows.filter((p) => p.paymentType === "made");

  const totalInvoiced = invoicesList.reduce((s, i) => s + parseFloat(i.total ?? "0"), 0);
  const totalCreditNotes = creditNotes.reduce(
    (s, i) => s + Math.abs(parseFloat(i.total ?? "0")),
    0
  );
  const totalPaid = paymentsReceived.reduce((s, p) => s + parseFloat(p.amount ?? "0"), 0);
  const totalRefunded = refunds.reduce((s, p) => s + parseFloat(p.amount ?? "0"), 0);
  const balance = visible.reduce((s, i) => s + parseFloat(i.amountDue ?? "0"), 0);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? null,
      city: customer.city ?? "",
      country: customer.country ?? "",
    },
    invoices: invoicesList.map((i) => ({
      id: i.id,
      issueDate: i.issueDate ?? "",
      dueDate: i.dueDate ?? "",
      invoiceNumber: i.invoiceNumber ?? "",
      total: parseFloat(i.total ?? "0"),
      amountPaid: parseFloat(i.amountPaid ?? "0"),
      amountDue: parseFloat(i.amountDue ?? "0"),
      status: i.status,
      currency: i.currency ?? "AED",
    })),
    creditNotes: creditNotes.map((i) => ({
      id: i.id,
      issueDate: i.issueDate ?? "",
      creditNoteNumber: i.invoiceNumber ?? "",
      total: Math.abs(parseFloat(i.total ?? "0")),
    })),
    payments: paymentsReceived.map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate ?? "",
      paymentNumber: p.paymentNumber ?? "",
      amount: parseFloat(p.amount ?? "0"),
    })),
    refunds: refunds.map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate ?? "",
      paymentNumber: p.paymentNumber ?? "",
      amount: parseFloat(p.amount ?? "0"),
    })),
    totalInvoiced,
    totalCreditNotes,
    totalPaid,
    totalRefunded,
    balance,
  };
}

export async function getPortalInvoice(
  organizationId: string,
  customerId: string,
  invoiceId: string
) {
  const [inv] = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      invoiceNumber: invoices.invoiceNumber,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      notes: invoices.notes,
      terms: invoices.terms,
      paymentInfo: invoices.paymentInfo,
      organizationId: invoices.organizationId,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, organizationId),
        eq(invoices.customerId, customerId)
      )
    )
    .limit(1);

  if (!inv) return null;
  if (inv.status === "draft" || inv.status === "cancelled") return null;

  const [customer] = await db
    .select({
      name: customers.name,
      email: customers.email,
      address: customers.address,
      taxNumber: customers.taxNumber,
    })
    .from(customers)
    .where(
      and(eq(customers.id, customerId), eq(customers.organizationId, organizationId))
    )
    .limit(1);

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, inv.id))
    .orderBy(invoiceLines.lineOrder);

  return {
    id: inv.id,
    customerId: inv.customerId,
    customerName: customer?.name ?? "",
    customerEmail: customer?.email ?? null,
    customerAddress: customer?.address ?? null,
    customerTaxNumber: customer?.taxNumber ?? null,
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    status: inv.status,
    currency: inv.currency ?? "AED",
    subtotal: parseFloat(inv.subtotal ?? "0"),
    taxAmount: parseFloat(inv.taxAmount ?? "0"),
    total: parseFloat(inv.total ?? "0"),
    amountPaid: parseFloat(inv.amountPaid ?? "0"),
    amountDue: parseFloat(inv.amountDue ?? "0"),
    notes: inv.notes,
    terms: inv.terms,
    paymentInfo: inv.paymentInfo,
    lines: lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: parseFloat(l.quantity ?? "1"),
      unitPrice: parseFloat(l.unitPrice ?? "0"),
      amount: parseFloat(l.amount ?? "0"),
      taxRate: parseFloat(l.taxRate ?? "0"),
      taxAmount: parseFloat(l.taxAmount ?? "0"),
    })),
  };
}
