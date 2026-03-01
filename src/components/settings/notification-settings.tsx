"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Mail, FileText, CreditCard, Users, Loader2 } from "lucide-react";
import { showSuccess } from "@/lib/utils/toast-helpers";

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

  function togglePref(id: string) {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    // Notification preferences are stored client-side for now
    // TODO: persist to user profile in DB when notification system is built
    await new Promise((r) => setTimeout(r, 500));
    showSuccess("Preferences saved", "Your notification preferences have been updated.");
    setSaving(false);
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

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
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
