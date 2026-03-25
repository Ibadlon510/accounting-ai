"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StyledSelect } from "@/components/ui/styled-select";
import { Plus, FileCode2, Star, Copy, Trash2, Pencil, Lock, Save, Loader2, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { TemplateEditor } from "./template-editor";

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  bill: "Bill",
  credit_note: "Credit Note",
  statement: "Statement",
  profit_and_loss: "P&L",
  balance_sheet: "Balance Sheet",
  vat_audit: "VAT Audit",
  inventory_valuation: "Inventory",
};

const FILTER_PILLS = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoices" },
  { id: "bill", label: "Bills" },
  { id: "statement", label: "Statements" },
  { id: "report", label: "Reports" },
];

const FONT_OPTIONS = [
  "Plus Jakarta Sans",
  "Inter",
  "Roboto",
  "Lato",
  "Open Sans",
  "Georgia",
  "Times New Roman",
];

type BuiltInTemplate = { id: string; name: string; documentType: string; isBuiltIn: true };
type CustomTemplate = { id: string; name: string; documentType: string; isDefault: boolean; baseTemplateId?: string | null; createdAt: string };

interface DocTypePdfSettings {
  pageSize: string;
  orientation: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  accentColor: string;
  fontFamily: string;
  showSections: { terms: boolean; notes: boolean; payment: boolean; signature: boolean; qrCode: boolean };
}

const DEFAULT_DOC_TYPE_SETTINGS: DocTypePdfSettings = {
  pageSize: "A4",
  orientation: "portrait",
  marginTop: "15mm",
  marginRight: "15mm",
  marginBottom: "20mm",
  marginLeft: "15mm",
  accentColor: "#1a1a2e",
  fontFamily: "Plus Jakarta Sans",
  showSections: { terms: true, notes: true, payment: true, signature: true, qrCode: false },
};

function BuiltInSettingsModal({ documentType, onClose }: { documentType: string; onClose: () => void }) {
  const [settings, setSettings] = useState<DocTypePdfSettings>({ ...DEFAULT_DOC_TYPE_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/org/document-pdf-settings?documentType=${documentType}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings({
            pageSize: d.settings.pageSize ?? "A4",
            orientation: d.settings.orientation ?? "portrait",
            marginTop: d.settings.marginTop ?? "15mm",
            marginRight: d.settings.marginRight ?? "15mm",
            marginBottom: d.settings.marginBottom ?? "20mm",
            marginLeft: d.settings.marginLeft ?? "15mm",
            accentColor: d.settings.accentColor ?? "#1a1a2e",
            fontFamily: d.settings.fontFamily ?? "Plus Jakarta Sans",
            showSections: d.settings.showSections ?? DEFAULT_DOC_TYPE_SETTINGS.showSections,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [documentType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/org/document-pdf-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, ...settings }),
      });
      if (res.ok) {
        showSuccess("Settings saved", `${DOC_TYPE_LABELS[documentType] ?? documentType} PDF settings updated.`);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Save failed", data.error ?? "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {DOC_TYPE_LABELS[documentType] ?? documentType} — PDF Settings
          </h3>
          <button onClick={onClose} className="text-text-meta hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Page Size</label>
              <StyledSelect value={settings.pageSize} onChange={(e) => setSettings((s) => ({ ...s, pageSize: e.target.value }))} className="h-9 text-[13px]">
                <option value="A4">A4</option><option value="Letter">Letter</option><option value="Legal">Legal</option>
              </StyledSelect>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Orientation</label>
              <StyledSelect value={settings.orientation} onChange={(e) => setSettings((s) => ({ ...s, orientation: e.target.value }))} className="h-9 text-[13px]">
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </StyledSelect>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-text-secondary">Margins</label>
            <div className="grid grid-cols-4 gap-3">
              {(["marginTop", "marginRight", "marginBottom", "marginLeft"] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] text-text-meta capitalize">{key.replace("margin", "")}</label>
                  <Input value={settings[key]} onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))} className="h-8 rounded-lg text-[12px]" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.accentColor} onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))} className="h-9 w-10 cursor-pointer rounded-lg border border-border-subtle" />
                <Input value={settings.accentColor} onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))} className="h-9 max-w-[100px] rounded-lg font-mono text-[12px]" maxLength={7} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Font Family</label>
              <StyledSelect value={settings.fontFamily} onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))} className="h-9 text-[13px]">
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </StyledSelect>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-text-secondary">Section Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "terms" as const, label: "Terms" },
                { key: "notes" as const, label: "Notes" },
                { key: "payment" as const, label: "Payment Info" },
                { key: "signature" as const, label: "Signature" },
                { key: "qrCode" as const, label: "QR Code" },
              ]).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 cursor-pointer hover:bg-black/[0.02]">
                  <Checkbox checked={settings.showSections[key]} onCheckedChange={(v) => setSettings((s) => ({ ...s, showSections: { ...s.showSections, [key]: !!v } }))} />
                  <span className="text-[12px] font-medium text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-xl text-[12px]">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="h-9 gap-2 rounded-xl bg-text-primary px-5 text-[12px] font-semibold text-white hover:bg-text-primary/90">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TemplateSettings() {
  const [filter, setFilter] = useState("all");
  const [builtIn, setBuiltIn] = useState<BuiltInTemplate[]>([]);
  const [custom, setCustom] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id?: string; documentType: string; htmlBody?: string; name?: string } | null>(null);
  const [settingsModal, setSettingsModal] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/pdf/templates");
      if (res.ok) {
        const data = await res.json();
        setBuiltIn(data.builtIn ?? []);
        setCustom(data.templates ?? []);
      } else {
        toast.error("Failed to load templates");
      }
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const reportTypes = ["profit_and_loss", "balance_sheet", "vat_audit", "inventory_valuation"];
  const filteredBuiltIn = builtIn.filter((t) => {
    if (filter === "all") return true;
    if (filter === "report") return reportTypes.includes(t.documentType);
    return t.documentType === filter;
  });
  const filteredCustom = custom.filter((t) => {
    if (filter === "all") return true;
    if (filter === "report") return reportTypes.includes(t.documentType);
    return t.documentType === filter;
  });

  const handleCustomize = (template: BuiltInTemplate) => {
    setEditingTemplate({ documentType: template.documentType, name: `Custom ${template.name}` });
    setEditorOpen(true);
  };
  const handleEdit = (template: CustomTemplate) => {
    setEditingTemplate({ id: template.id, documentType: template.documentType, name: template.name });
    setEditorOpen(true);
  };
  const handleCreate = () => {
    setEditingTemplate({ documentType: "invoice", name: "New Template" });
    setEditorOpen(true);
  };
  const handleDuplicate = async (template: CustomTemplate) => {
    try {
      const res = await fetch(`/api/pdf/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${template.name} (Copy)`, documentType: template.documentType, htmlBody: "<div><!-- Copy --></div>" }),
      });
      if (res.ok) { toast.success("Template duplicated"); fetchTemplates(); }
    } catch { toast.error("Failed to duplicate template"); }
  };
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pdf/templates/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Template deleted"); fetchTemplates(); }
    } catch { toast.error("Failed to delete template"); }
  };
  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/pdf/templates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
      if (res.ok) { toast.success("Default template updated"); fetchTemplates(); }
    } catch { toast.error("Failed to set default"); }
  };

  if (loading) {
    return <div className="dashboard-card py-8 text-center text-text-secondary">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* ── Template List ── */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">PDF Templates</h2>
            <p className="mt-1 text-[13px] text-text-secondary">Manage and customize PDF templates for documents and reports</p>
          </div>
          <Button onClick={handleCreate} size="sm" className="gap-1.5 rounded-xl bg-text-primary px-4 text-white hover:bg-text-primary/90">
            <Plus className="h-3.5 w-3.5" /> Create Template
          </Button>
        </div>
        <div className="mt-5 flex gap-2">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                filter === pill.id ? "bg-text-primary text-white" : "bg-surface text-text-secondary hover:bg-black/5 hover:text-text-primary"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBuiltIn.length > 0 && (
        <div className="dashboard-card">
          <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Built-in Templates</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {filteredBuiltIn.map((t) => (
              <div key={t.id} className="group relative rounded-xl border border-border-subtle p-4 hover:border-text-primary/20 hover:shadow-sm transition-all">
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-canvas/50">
                  <FileCode2 className="h-8 w-8 text-text-meta/40" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">{t.name}</div>
                    <div className="mt-0.5 text-[11px] text-text-meta">{DOC_TYPE_LABELS[t.documentType] ?? t.documentType}</div>
                  </div>
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-meta/50" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Button onClick={() => handleCustomize(t)} variant="outline" size="xs" className="flex-1 rounded-lg border-border-subtle text-[11px]">
                    Customize
                  </Button>
                  <Button onClick={() => setSettingsModal(t.documentType)} variant="outline" size="icon-xs" title="PDF Settings">
                    <Settings2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredCustom.length > 0 && (
        <div className="dashboard-card">
          <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Custom Templates</h3>
          <ScrollArea className="max-h-[400px]">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {filteredCustom.map((t) => (
                <div key={t.id} className="group relative rounded-xl border border-border-subtle p-4 hover:border-text-primary/20 hover:shadow-sm transition-all">
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-canvas/50">
                    <FileCode2 className="h-8 w-8 text-text-meta/40" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">{t.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-text-meta">{DOC_TYPE_LABELS[t.documentType] ?? t.documentType}</span>
                        {t.isDefault && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                            <Star className="h-2.5 w-2.5" /> Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <Button onClick={() => handleEdit(t)} variant="outline" size="icon-xs" title="Edit"><Pencil className="h-3 w-3" /></Button>
                    <Button onClick={() => handleDuplicate(t)} variant="outline" size="icon-xs" title="Duplicate"><Copy className="h-3 w-3" /></Button>
                    {!t.isDefault && <Button onClick={() => handleSetDefault(t.id)} variant="outline" size="icon-xs" title="Set as Default"><Star className="h-3 w-3" /></Button>}
                    <Button onClick={() => handleDelete(t.id)} variant="outline" size="icon-xs" title="Delete" className="text-error hover:text-error"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
        <div className="dashboard-card py-12 text-center">
          <FileCode2 className="mx-auto h-10 w-10 text-text-meta/30" />
          <p className="mt-3 text-[14px] text-text-secondary">No templates found for this filter</p>
        </div>
      )}

      {editorOpen && editingTemplate && (
        <TemplateEditor
          open={editorOpen}
          onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditingTemplate(null); fetchTemplates(); } }}
          templateId={editingTemplate.id}
          documentType={editingTemplate.documentType}
          initialName={editingTemplate.name}
        />
      )}

      {settingsModal && (
        <BuiltInSettingsModal documentType={settingsModal} onClose={() => setSettingsModal(null)} />
      )}
    </div>
  );
}
