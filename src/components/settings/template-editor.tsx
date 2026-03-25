"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderReference } from "@/components/pdf/placeholder-reference";
import { StyledSelect } from "@/components/ui/styled-select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Download, Loader2, Code2, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  EntityPanel,
  EntityPanelContent,
} from "@/components/overlays/entity-panel";

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  documentType: string;
  initialName?: string;
}

const DOC_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "bill", label: "Bill" },
  { value: "credit_note", label: "Credit Note" },
  { value: "statement", label: "Statement" },
  { value: "profit_and_loss", label: "Profit & Loss" },
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "vat_audit", label: "VAT Audit" },
  { value: "inventory_valuation", label: "Inventory Valuation" },
];

type EditorTab = "body" | "css" | "header" | "footer" | "settings";
type ViewMode = "code" | "preview";

const FONT_OPTIONS = [
  "Plus Jakarta Sans", "Inter", "Roboto", "Lato", "Open Sans", "Georgia", "Times New Roman",
];

export function TemplateEditor({
  open,
  onOpenChange,
  templateId,
  documentType: initialDocType,
  initialName,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName ?? "New Template");
  const [documentType, setDocumentType] = useState(initialDocType);
  const [htmlBody, setHtmlBody] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [marginTop, setMarginTop] = useState("15mm");
  const [marginRight, setMarginRight] = useState("15mm");
  const [marginBottom, setMarginBottom] = useState("20mm");
  const [marginLeft, setMarginLeft] = useState("15mm");
  const [accentColor, setAccentColor] = useState("#1a1a2e");
  const [fontFamily, setFontFamily] = useState("Plus Jakarta Sans");
  const [showSections, setShowSections] = useState({ terms: true, notes: true, payment: true, signature: true, qrCode: false });
  const [activeTab, setActiveTab] = useState<EditorTab>("body");
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (templateId) {
      fetch(`/api/pdf/templates?documentType=${initialDocType}`)
        .then((r) => r.json())
        .then((data) => {
          const tpl = (data.templates ?? []).find((t: { id: string }) => t.id === templateId);
          if (tpl) {
            setName(tpl.name);
            setDocumentType(tpl.documentType);
            setHtmlBody(tpl.htmlBody ?? "");
            setCustomCss(tpl.customCss ?? "");
            setHeaderHtml(tpl.headerHtml ?? "");
            setFooterHtml(tpl.footerHtml ?? "");
            setPageSize(tpl.pageSize ?? "A4");
            setOrientation(tpl.orientation ?? "portrait");
            setMarginTop(tpl.marginTop ?? "15mm");
            setMarginRight(tpl.marginRight ?? "15mm");
            setMarginBottom(tpl.marginBottom ?? "20mm");
            setMarginLeft(tpl.marginLeft ?? "15mm");
            setAccentColor(tpl.accentColor ?? "#1a1a2e");
            setFontFamily(tpl.fontFamily ?? "Plus Jakarta Sans");
            if (tpl.showSections) setShowSections(tpl.showSections);
          }
        })
        .catch(() => {});
    } else {
      fetch(`/api/pdf/templates/base-html?documentType=${initialDocType}&variant=modern`)
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

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/pdf/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          sampleData: true,
          customHtml: htmlBody || undefined,
          customSlots: {
            customCss: customCss || undefined,
            headerHtml: headerHtml || undefined,
            footerHtml: footerHtml || undefined,
          },
        }),
      });
      if (res.ok) setPreviewHtml(await res.text());
    } catch {
      setPreviewHtml("<p style='padding:40px;color:#dc2626'>Preview failed</p>");
    } finally {
      setLoadingPreview(false);
    }
  }, [documentType, htmlBody, customCss, headerHtml, footerHtml]);

  useEffect(() => {
    if (viewMode === "preview" && open) loadPreview();
  }, [viewMode, open, loadPreview]);

  const handleSave = async (setDefault = false) => {
    if (!name.trim() || !htmlBody.trim()) {
      toast.error("Template name and body are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, documentType, htmlBody, customCss, headerHtml, footerHtml, pageSize, orientation, marginTop, marginRight, marginBottom, marginLeft, accentColor, fontFamily, showSections, isDefault: setDefault || undefined };
      const url = templateId ? `/api/pdf/templates/${templateId}` : "/api/pdf/templates";
      const method = templateId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  const handleInsertPlaceholder = (key: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    setViewMode("code");
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const currentValue = activeTab === "body" ? htmlBody : activeTab === "css" ? customCss : activeTab === "header" ? headerHtml : footerHtml;
    const newValue = currentValue.slice(0, start) + key + currentValue.slice(end);
    if (activeTab === "body") setHtmlBody(newValue);
    else if (activeTab === "css") setCustomCss(newValue);
    else if (activeTab === "header") setHeaderHtml(newValue);
    else setFooterHtml(newValue);
    setShowPlaceholders(false);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + key.length; });
  };

  const editorTabs: { id: EditorTab; label: string }[] = [
    { id: "body", label: "Body HTML" },
    { id: "css", label: "Custom CSS" },
    { id: "header", label: "Header" },
    { id: "footer", label: "Footer" },
    { id: "settings", label: "Settings" },
  ];

  const currentValue = activeTab === "body" ? htmlBody : activeTab === "css" ? customCss : activeTab === "header" ? headerHtml : footerHtml;
  const setCurrentValue = activeTab === "body" ? setHtmlBody : activeTab === "css" ? setCustomCss : activeTab === "header" ? setHeaderHtml : setFooterHtml;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl" className="flex h-[90vh] flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className="h-8 max-w-[180px] rounded-lg text-[13px] font-semibold"
          />
          <StyledSelect value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="h-8 max-w-[150px] text-[12px]">
            {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
          </StyledSelect>
          <StyledSelect value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="h-8 w-[70px] text-[12px]">
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </StyledSelect>
          <StyledSelect value={orientation} onChange={(e) => setOrientation(e.target.value)} className="h-8 w-[100px] text-[12px]">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
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
                  <PlaceholderReference documentType={documentType} onInsert={handleInsertPlaceholder} />
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "code" ? (
            <div className="flex h-full flex-col">
              <div className="flex gap-1 border-b border-border-subtle px-3 py-1.5">
                {editorTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                      activeTab === tab.id ? "bg-text-primary/10 text-text-primary" : "text-text-meta hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === "settings" ? (
                <div className="flex-1 overflow-auto p-6">
                  <div className="mx-auto max-w-lg space-y-5">
                    <div className="grid grid-cols-4 gap-3">
                      {([["marginTop", marginTop, setMarginTop, "Top"], ["marginRight", marginRight, setMarginRight, "Right"], ["marginBottom", marginBottom, setMarginBottom, "Bottom"], ["marginLeft", marginLeft, setMarginLeft, "Left"]] as const).map(([, val, setter, label]) => (
                        <div key={label}>
                          <label className="mb-1 block text-[11px] font-medium text-text-meta">{label}</label>
                          <Input value={val} onChange={(e) => setter(e.target.value)} className="h-8 rounded-lg text-[12px]" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-10 cursor-pointer rounded-lg border border-border-subtle" />
                          <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 max-w-[100px] rounded-lg font-mono text-[12px]" maxLength={7} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Font Family</label>
                        <StyledSelect value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="h-9 text-[13px]">
                          {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </StyledSelect>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] font-medium text-text-secondary">Section Visibility</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: "terms" as const, label: "Terms & Conditions" },
                          { key: "notes" as const, label: "Notes" },
                          { key: "payment" as const, label: "Payment Info" },
                          { key: "signature" as const, label: "Signature" },
                          { key: "qrCode" as const, label: "QR Code" },
                        ]).map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 cursor-pointer hover:bg-black/[0.02]">
                            <Checkbox checked={showSections[key]} onCheckedChange={(v) => setShowSections((s) => ({ ...s, [key]: !!v }))} />
                            <span className="text-[12px] font-medium text-text-primary">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  spellCheck={false}
                  className="flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-text-primary outline-none placeholder:text-text-meta/50"
                  placeholder={`Enter ${activeTab === "css" ? "CSS" : "HTML"} here…`}
                />
              )}
            </div>
          ) : (
            <div className="h-full overflow-auto bg-[#525659] p-6">
              {loadingPreview ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                </div>
              ) : (
                <div className="mx-auto max-w-[800px]">
                  <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
                    <iframe
                      srcDoc={previewHtml}
                      className="h-[1123px] w-full border-0"
                      title="Preview"
                      sandbox="allow-same-origin"
                      style={{ transform: "scale(1)", transformOrigin: "top center" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-6 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="gap-1.5 rounded-xl border-border-subtle text-[12px]"
          >
            <Download className="h-3 w-3" /> Save & Set Default
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(false)}
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
