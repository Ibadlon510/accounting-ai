"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendEmail } from "@/hooks/use-send-email";
import { Mail, Loader2, X, Paperclip, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  EntityPanel,
  EntityPanelContent,
} from "@/components/overlays/entity-panel";

interface SendDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  documentId?: string;
  documentNumber?: string;
  recipientEmail?: string;
  recipientName?: string;
  data?: Record<string, unknown>;
}

export function SendDocumentModal({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumber,
  recipientEmail: defaultEmail,
  recipientName: defaultName,
  data,
}: SendDocumentModalProps) {
  const [to, setTo] = useState(defaultEmail ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const { sendEmail, isSending } = useSendEmail();

  useEffect(() => {
    if (open) {
      setTo(defaultEmail ?? "");
      setCc("");
      setBcc("");
      setShowCcBcc(false);
      const docLabel = documentType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      setSubject(`${docLabel}${documentNumber ? ` ${documentNumber}` : ""}`);
      setBody("");
    }
  }, [open, defaultEmail, documentType, documentNumber]);

  const handleSend = async () => {
    if (!to.trim()) return;

    const success = await sendEmail({
      documentType,
      documentId,
      recipientEmail: to.trim(),
      recipientName: defaultName,
      cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
      bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
      subject: subject || undefined,
      body: body || undefined,
      data,
      documentNumber,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const docLabel = documentType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const missingEmail = !defaultEmail;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg" className="flex h-[80vh] flex-col">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-text-meta" />
            <h2 className="text-[16px] font-semibold text-text-primary">
              Send {docLabel}{documentNumber ? ` ${documentNumber}` : ""}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {missingEmail && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No email on file for this contact. Please enter an email address.
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">To</label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              className="h-10 rounded-xl border-border-subtle text-[13px]"
            />
          </div>

          <button
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="flex items-center gap-1 text-[12px] font-medium text-text-meta hover:text-text-primary"
          >
            {showCcBcc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            CC / BCC
          </button>

          {showCcBcc && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-meta">CC</label>
                <Input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com, cc2@example.com"
                  className="h-9 rounded-xl border-border-subtle text-[12px]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-meta">BCC</label>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="h-9 rounded-xl border-border-subtle text-[12px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="h-10 rounded-xl border-border-subtle text-[13px]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Message (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a personal message to the email…"
              rows={6}
              className="w-full rounded-xl border border-border-subtle bg-transparent p-3 text-[13px] text-text-primary outline-none placeholder:text-text-meta/50 focus-visible:ring-2 focus-visible:ring-text-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface/50 px-4 py-3">
            <Paperclip className="h-4 w-4 text-text-meta" />
            <div>
              <div className="text-[13px] font-medium text-text-primary">
                {docLabel}{documentNumber ? ` ${documentNumber}` : ""}.pdf
              </div>
              <div className="text-[11px] text-text-meta">PDF will be generated and attached automatically</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isSending || !to.trim()}
            className="gap-1.5 rounded-xl bg-text-primary px-6 text-white hover:bg-text-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            {isSending ? "Sending…" : "Send Email"}
          </Button>
        </div>
      </EntityPanelContent>
    </EntityPanel>
  );
}
