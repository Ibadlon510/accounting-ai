import { Resend } from "resend";
import { db } from "@/lib/db";
import { organizations, sentEmails, auditLogs, emailTemplates, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { compileTemplate } from "@/lib/pdf/template-engine";
import { generatePdf } from "@/lib/pdf/engine";
import { interpolate } from "@/lib/pdf/placeholders";
import { wrapInEmailLayout } from "./email-templates/email-base-layout";
import { invoiceDeliveryTemplate } from "./email-templates/invoice-delivery";
import { billDeliveryTemplate } from "./email-templates/bill-delivery";
import { statementDeliveryTemplate } from "./email-templates/statement-delivery";
import { paymentReceiptTemplate } from "./email-templates/payment-receipt";
import { paymentReminderTemplate } from "./email-templates/payment-reminder";
import { overdueNoticeTemplate } from "./email-templates/overdue-notice";
import type { PdfDocumentType } from "@/lib/pdf/types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Agar Smart Accounting <onboarding@resend.dev>";

const BUILT_IN_EMAIL_TEMPLATES: Record<string, { name: string; subject: string; htmlBody: string }> = {
  invoice: invoiceDeliveryTemplate,
  bill: billDeliveryTemplate,
  statement: statementDeliveryTemplate,
  payment_receipt: paymentReceiptTemplate,
  payment_reminder: paymentReminderTemplate,
  overdue_notice: overdueNoticeTemplate,
};

export interface SendDocumentEmailOptions {
  documentType: string;
  documentId?: string;
  recipientEmail: string;
  recipientName?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  emailTemplateId?: string;
  pdfTemplateId?: string;
  senderId: string;
  orgId: string;
  data?: Record<string, unknown>;
  documentNumber?: string;
}

async function resolveEmailTemplate(
  orgId: string,
  documentType: string,
  emailTemplateId?: string
): Promise<{ subject: string; htmlBody: string }> {
  if (emailTemplateId) {
    const [custom] = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.id, emailTemplateId), eq(emailTemplates.organizationId, orgId)))
      .limit(1);
    if (custom) return { subject: custom.subject, htmlBody: custom.htmlBody };
  }

  const [orgDefault] = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.organizationId, orgId),
        eq(emailTemplates.documentType, documentType),
        eq(emailTemplates.isDefault, true),
        eq(emailTemplates.isActive, true)
      )
    )
    .limit(1);
  if (orgDefault) return { subject: orgDefault.subject, htmlBody: orgDefault.htmlBody };

  const builtIn = BUILT_IN_EMAIL_TEMPLATES[documentType];
  if (builtIn) return { subject: builtIn.subject, htmlBody: builtIn.htmlBody };

  return {
    subject: `Document from your provider`,
    htmlBody: `<p>Please find the attached document.</p>`,
  };
}

export async function sendDocumentEmail(options: SendDocumentEmailOptions): Promise<{ ok: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    return { ok: false, error: "Email not configured. RESEND_API_KEY is missing." };
  }

  const {
    documentType, documentId, recipientEmail, recipientName,
    cc, bcc, subject: subjectOverride, body: bodyOverride,
    emailTemplateId, pdfTemplateId, senderId, orgId, data,
    documentNumber,
  } = options;

  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) return { ok: false, error: "Organization not found" };

    const pdfDocTypes: PdfDocumentType[] = ["invoice", "bill", "credit_note", "statement", "profit_and_loss", "balance_sheet", "vat_audit", "inventory_valuation"];
    let pdfBuffer: Buffer | null = null;
    let attachmentFilename: string | null = null;

    if (pdfDocTypes.includes(documentType as PdfDocumentType)) {
      const html = await compileTemplate({
        orgId,
        documentType: documentType as PdfDocumentType,
        templateId: pdfTemplateId,
        data,
      });
      pdfBuffer = await generatePdf(html);
      attachmentFilename = `${documentType}${documentNumber ? `-${documentNumber}` : ""}-${new Date().toISOString().split("T")[0]}.pdf`;
    }

    const template = await resolveEmailTemplate(orgId, documentType, emailTemplateId);

    const templateData: Record<string, unknown> = {
      company: {
        name: org.name,
        address: org.address,
        phone: org.phone,
        email: org.email,
        logoUrl: org.logoUrl,
        taxRegistrationNumber: org.taxRegistrationNumber,
        currency: org.currency,
      },
      currentDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      currentYear: new Date().getFullYear().toString(),
      ...data,
    };

    const orgFmt = { numberFormat: org.numberFormat, dateFormat: org.dateFormat };
    const finalSubject = subjectOverride ?? interpolate(template.subject, templateData, org.currency, orgFmt);
    const bodyHtml = bodyOverride ?? interpolate(template.htmlBody, templateData, org.currency, orgFmt);
    const signatureHtml = org.emailSignatureHtml ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6">${org.emailSignatureHtml}</div>` : "";
    const fullHtml = wrapInEmailLayout(bodyHtml + signatureHtml, org.name);

    const fromName = org.emailFromName ?? org.name;
    const fromAddress = `${fromName} <${FROM_ADDRESS.split("<")[1]?.replace(">", "") ?? "onboarding@resend.dev"}>`;

    const attachments = pdfBuffer && attachmentFilename
      ? [{ filename: attachmentFilename, content: pdfBuffer.toString("base64") }]
      : [];

    const { data: emailResult, error } = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      cc: cc?.length ? cc : org.emailDefaultCc ? [org.emailDefaultCc] : undefined,
      bcc: bcc?.length ? bcc : undefined,
      replyTo: org.emailReplyTo ?? undefined,
      subject: finalSubject,
      html: fullHtml,
      attachments,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const [emailRecord] = await db
      .insert(sentEmails)
      .values({
        organizationId: orgId,
        sentBy: senderId,
        documentType,
        documentId: documentId ?? null,
        documentNumber: documentNumber ?? null,
        recipientEmail,
        recipientName: recipientName ?? null,
        ccEmails: cc?.join(", ") ?? (org.emailDefaultCc ?? null),
        bccEmails: bcc?.join(", ") ?? null,
        subject: finalSubject,
        htmlBody: fullHtml,
        hasAttachment: !!pdfBuffer,
        attachmentFilename,
        resendEmailId: emailResult?.id ?? null,
        status: "sent",
        emailTemplateId: emailTemplateId ?? null,
        pdfTemplateId: pdfTemplateId ?? null,
      })
      .returning();

    try {
      await db.insert(notifications).values({
        organizationId: orgId,
        userId: senderId,
        category: "documents",
        title: "Email Sent",
        message: `${documentType} emailed to ${recipientEmail}`,
        icon: "mail",
        actionUrl: `/settings?tab=email-history`,
      });

      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: senderId,
        action: "email_sent",
        entity: documentType,
        entityId: documentId ?? null,
        metadata: { recipientEmail, documentNumber, emailId: emailRecord?.id },
      });
    } catch {
      // non-critical
    }

    return { ok: true, emailId: emailRecord?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, error: msg };
  }
}

export function getBuiltInEmailTemplates() {
  return Object.entries(BUILT_IN_EMAIL_TEMPLATES).map(([docType, tpl]) => ({
    id: `builtin-${docType}`,
    name: tpl.name,
    documentType: docType,
    subject: tpl.subject,
    isBuiltIn: true,
  }));
}
