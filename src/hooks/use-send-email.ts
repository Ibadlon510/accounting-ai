"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface SendEmailOptions {
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
  data?: Record<string, unknown>;
  documentNumber?: string;
}

export function useSendEmail() {
  const [isSending, setIsSending] = useState(false);

  const sendEmail = useCallback(async (options: SendEmailOptions): Promise<boolean> => {
    setIsSending(true);
    try {
      const res = await fetch("/api/email/send-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Send failed" }));
        toast.error(err.error ?? "Failed to send email");
        return false;
      }

      toast.success(`Email sent to ${options.recipientEmail}`);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send email";
      toast.error(msg);
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  return { sendEmail, isSending };
}
