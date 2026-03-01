"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      showError("Missing fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      showError("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Mismatch", "New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Password changed", "Your password has been updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError("Failed", data.error || "Could not change password.");
      }
    } catch {
      showError("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          <h2 className="text-[18px] font-semibold text-text-primary">Change Password</h2>
        </div>
        <p className="mt-1 text-[13px] text-text-secondary">
          Update your account password. Not available for Google OAuth accounts.
        </p>

        <div className="mt-6 max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 rounded-xl border-border-subtle bg-transparent pr-10 text-[14px] focus-visible:ring-text-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-meta hover:text-text-secondary"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="h-11 rounded-xl border-border-subtle bg-transparent pr-10 text-[14px] focus-visible:ring-text-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-meta hover:text-text-secondary"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="h-10 gap-2 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
