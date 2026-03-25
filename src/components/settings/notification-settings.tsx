"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Mail, FileText, CreditCard, Users, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
}

const defaultPrefs: NotificationPref[] = [
  {
    id: "billing",
    label: "Billing & Subscription",
    description: "Payment confirmations, subscription changes, and low token alerts",
    icon: CreditCard,
    enabled: true,
  },
  {
    id: "team",
    label: "Team Activity",
    description: "New member joins, invite accepted, role changes",
    icon: Users,
    enabled: true,
  },
  {
    id: "documents",
    label: "Document Processing",
    description: "AI scan complete, verification needed, processing errors",
    icon: FileText,
    enabled: true,
  },
  {
    id: "reports",
    label: "Reports & Reminders",
    description: "Monthly summary, VAT return reminders, overdue invoices",
    icon: Mail,
    enabled: false,
  },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { preferences?: Record<string, boolean> } | null) => {
        if (data?.preferences && Object.keys(data.preferences).length > 0) {
          setPrefs((prev) =>
            prev.map((p) => ({
              ...p,
              enabled: data.preferences![p.id] ?? p.enabled,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
  }, []);

  function togglePref(id: string) {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const preferences: Record<string, boolean> = {};
      prefs.forEach((p) => { preferences[p.id] = p.enabled; });

      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (res.ok) {
        showSuccess("Preferences saved", "Your notification preferences have been updated.");
      } else {
        showError("Failed to save preferences");
      }
    } catch {
      showError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          <h2 className="text-[18px] font-semibold text-text-primary">
            Email Notifications
          </h2>
        </div>
        <p className="mt-1 text-[13px] text-text-secondary">
          Choose which email notifications you&apos;d like to receive
        </p>

        {loadingPrefs ? (
          <div className="mt-6 flex items-center justify-center py-8 text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading preferences...
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {prefs.map((pref) => {
              const Icon = pref.icon;
              return (
                <button
                  key={pref.id}
                  onClick={() => togglePref(pref.id)}
                  className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${
                    pref.enabled
                      ? "border-text-primary/20 bg-text-primary/5"
                      : "border-border-subtle hover:border-border-subtle/80"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      pref.enabled ? "bg-text-primary/10" : "bg-surface"
                    }`}
                  >
                    <Icon
                      className={`h-4.5 w-4.5 ${
                        pref.enabled ? "text-text-primary" : "text-text-meta"
                      }`}
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-text-primary">
                      {pref.label}
                    </div>
                    <div className="text-[12px] text-text-secondary">
                      {pref.description}
                    </div>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full transition-colors ${
                      pref.enabled ? "bg-text-primary" : "bg-border-subtle"
                    } relative`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        pref.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || loadingPrefs}
            className="h-10 gap-2 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
