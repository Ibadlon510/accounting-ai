"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Mail, Star, Copy, Trash2, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { EmailTemplateEditorModal } from "./email-template-editor";

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  bill: "Bill",
  statement: "Statement",
  payment_receipt: "Payment Receipt",
  payment_reminder: "Payment Reminder",
  overdue_notice: "Overdue Notice",
};

const FILTER_PILLS = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoice" },
  { id: "bill", label: "Bill" },
  { id: "statement", label: "Statement" },
  { id: "payment_receipt", label: "Receipt" },
  { id: "payment_reminder", label: "Reminder" },
];

type BuiltInEmailTpl = { id: string; name: string; documentType: string; subject: string; isBuiltIn: true };
type CustomEmailTpl = { id: string; name: string; documentType: string; subject: string; isDefault: boolean; createdAt: string };

export function EmailTemplateSettings() {
  const [filter, setFilter] = useState("all");
  const [builtIn, setBuiltIn] = useState<BuiltInEmailTpl[]>([]);
  const [custom, setCustom] = useState<CustomEmailTpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id?: string; documentType: string; name?: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/email/templates");
      if (res.ok) {
        const data = await res.json();
        setBuiltIn(data.builtIn ?? []);
        setCustom(data.templates ?? []);
      } else {
        toast.error("Failed to load email templates");
      }
    } catch {
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filteredBuiltIn = builtIn.filter((t) => filter === "all" || t.documentType === filter);
  const filteredCustom = custom.filter((t) => filter === "all" || t.documentType === filter);

  const handleEdit = (t: CustomEmailTpl) => {
    setEditingTemplate({ id: t.id, documentType: t.documentType, name: t.name });
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate({ documentType: "invoice", name: "New Email Template" });
    setEditorOpen(true);
  };

  const handleCustomize = (t: BuiltInEmailTpl) => {
    setEditingTemplate({ documentType: t.documentType, name: `Custom ${t.name}` });
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/email/templates/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Template deleted"); fetchTemplates(); }
    } catch { toast.error("Failed to delete template"); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/email/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) { toast.success("Default updated"); fetchTemplates(); }
    } catch { toast.error("Failed to set default"); }
  };

  if (loading) {
    return <div className="dashboard-card py-8 text-center text-text-secondary">Loading email templates…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">Email Templates</h2>
            <p className="mt-1 text-[13px] text-text-secondary">Customize email templates for document delivery</p>
          </div>
          <Button onClick={handleCreate} size="sm" className="gap-1.5 rounded-xl bg-text-primary px-4 text-white hover:bg-text-primary/90">
            <Plus className="h-3.5 w-3.5" /> Create Template
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                filter === pill.id ? "bg-text-primary text-white" : "bg-surface text-text-secondary hover:bg-black/5"
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
          <div className="space-y-2">
            {filteredBuiltIn.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3 hover:border-text-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas/50">
                    <Mail className="h-4 w-4 text-text-meta/50" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-text-primary">{t.name}</span>
                      <Lock className="h-3 w-3 text-text-meta/50" />
                    </div>
                    <div className="text-[11px] text-text-meta">{DOC_TYPE_LABELS[t.documentType]} • {t.subject}</div>
                  </div>
                </div>
                <Button onClick={() => handleCustomize(t)} variant="outline" size="xs" className="rounded-lg border-border-subtle text-[11px]">
                  Customize
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredCustom.length > 0 && (
        <div className="dashboard-card">
          <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Custom Templates</h3>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {filteredCustom.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3 hover:border-text-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas/50">
                      <Mail className="h-4 w-4 text-text-meta/50" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-text-primary">{t.name}</span>
                        {t.isDefault && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                            <Star className="h-2.5 w-2.5" /> Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-meta">{DOC_TYPE_LABELS[t.documentType]} • {t.subject}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => handleEdit(t)} variant="outline" size="icon-xs"><Pencil className="h-3 w-3" /></Button>
                    {!t.isDefault && <Button onClick={() => handleSetDefault(t.id)} variant="outline" size="icon-xs"><Star className="h-3 w-3" /></Button>}
                    <Button onClick={() => handleDelete(t.id)} variant="outline" size="icon-xs" className="text-error hover:text-error"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {editorOpen && editingTemplate && (
        <EmailTemplateEditorModal
          open={editorOpen}
          onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditingTemplate(null); fetchTemplates(); } }}
          templateId={editingTemplate.id}
          documentType={editingTemplate.documentType}
          initialName={editingTemplate.name}
        />
      )}
    </div>
  );
}
