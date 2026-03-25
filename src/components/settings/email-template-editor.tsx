"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderReference } from "@/components/pdf/placeholder-reference";
import { StyledSelect } from "@/components/ui/styled-select";
import { X, Save, Loader2, Code2, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { EntityPanel, EntityPanelContent } from "@/components/overlays/entity-panel";

interface EmailTemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  documentType: string;
  initialName?: string;
}

const DOC_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "bill", label: "Bill" },
  { value: "statement", label: "Statement" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "overdue_notice", label: "Overdue Notice" },
];

type ViewMode = "code" | "preview";

export function EmailTemplateEditorModal({
  open,
  onOpenChange,
  templateId,
  documentType: initialDocType,
  initialName,
}: EmailTemplateEditorModalProps) {
  const [name, setName] = useState(initialName ?? "New Email Template");
  const [documentType, setDocumentType] = useState(initialDocType);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (templateId) {
      fetch(`/api/email/templates?documentType=${initialDocType}`)
        .then((r) => r.json())
        .then((data) => {
          const tpl = (data.templates ?? []).find((t: { id: string }) => t.id === templateId);
          if (tpl) {
            setName(tpl.name);
            setDocumentType(tpl.documentType);
            setSubject(tpl.subject);
            setHtmlBody(tpl.htmlBody ?? "");
          }
        })
        .catch(() => {});
    } else {
      fetch(`/api/email/templates/base-html?documentType=${initialDocType}`)
        .then((r) => { if (r.ok) return r.text(); throw new Error(); })
        .then((html) => { if (html && !htmlBody) setHtmlBody(html); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId, initialDocType]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (placeholderRef.current && !placeholderRef.current.contains(e.target as Node)) {
        setShowPlaceholders(false);
      }
    }
    if (showPlaceholders) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPlaceholders]);

  const updatePreview = useCallback(() => {
    const preview = `<!DOCTYPE html><html><head><style>
      body{font-family:-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#4b5563;margin:0;padding:32px;background:#525659}
      .card{background:white;border-radius:16px;padding:32px;max-width:600px;margin:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15)}
      h1{font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 8px}
      p{margin:0 0 16px}
    </style></head><body><div class="card"><p style="color:#9ca3af;font-size:12px;margin-bottom:16px;border-bottom:1px solid #f3f4f6;padding-bottom:12px"><strong>Subject:</strong> ${subject}</p>${htmlBody}</div></body></html>`;
    setPreviewHtml(preview);
  }, [subject, htmlBody]);

  useEffect(() => {
    if (viewMode === "preview" && open) updatePreview();
  }, [viewMode, open, updatePreview]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !htmlBody.trim()) {
      toast.error("Name, subject, and body are required");
      return;
    }
    setSaving(true);
    try {
      const url = templateId ? `/api/email/templates/${templateId}` : "/api/email/templates";
      const method = templateId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, documentType, subject, htmlBody }) });
      if (res.ok) {
        toast.success(templateId ? "Template updated" : "Template created");
        onOpenChange(false);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInsert = (key: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    setViewMode("code");
    const start = ta.selectionStart;
    const newVal = htmlBody.slice(0, start) + key + htmlBody.slice(ta.selectionEnd);
    setHtmlBody(newVal);
    setShowPlaceholders(false);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + key.length; });
  };

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl" className="flex h-[85vh] flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 max-w-[180px] rounded-lg text-[13px] font-semibold" />
          <StyledSelect value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="h-8 max-w-[160px] text-[12px]">
            {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
          </StyledSelect>

          {/* Placeholders Dropdown */}
          <div className="relative" ref={placeholderRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="h-8 gap-1 rounded-lg border-border-subtle text-[12px]"
            >
              Placeholders <ChevronDown className="h-3 w-3" />
            </Button>
            {showPlaceholders && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[320px] rounded-xl border border-border-subtle bg-surface shadow-xl">
                <div className="h-[400px]">
                  <PlaceholderReference documentType={documentType} onInsert={handleInsert} />
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="ml-auto flex items-center rounded-lg border border-border-subtle p-0.5">
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                viewMode === "code" ? "bg-text-primary text-white" : "text-text-meta hover:text-text-primary"
              }`}
            >
              <Code2 className="h-3 w-3" /> Code
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                viewMode === "preview" ? "bg-text-primary text-white" : "text-text-meta hover:text-text-primary"
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Subject Line */}
        <div className="border-b border-border-subtle px-4 py-2.5">
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-semibold text-text-meta whitespace-nowrap">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Invoice {{invoice.number}} from {{company.name}}'
              className="h-8 flex-1 rounded-lg text-[12px]"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "code" ? (
            <textarea
              ref={textareaRef}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-text-primary outline-none placeholder:text-text-meta/50"
              placeholder="<h1>Your Document</h1><p>Dear {{invoice.customerName}},</p>..."
            />
          ) : (
            <div className="h-full overflow-auto bg-[#525659] p-6">
              <div className="mx-auto max-w-[640px]">
                <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
                  <iframe
                    srcDoc={previewHtml}
                    className="h-[600px] w-full border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-6 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 rounded-xl bg-text-primary px-5 text-white hover:bg-text-primary/90"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </div>
      </EntityPanelContent>
    </EntityPanel>
  );
}
