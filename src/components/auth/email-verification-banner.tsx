"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailWarning, X, RefreshCw, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";

export function EmailVerificationBanner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const hasRefreshed = useRef(false);

  // When user lands on /dashboard?verified=true after clicking the link,
  // refresh the session so the JWT picks up the new emailVerified value.
  useEffect(() => {
    if (searchParams.get("verified") === "true" && !hasRefreshed.current) {
      hasRefreshed.current = true;
      update().then(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        router.replace(url.pathname + url.search);
      });
    }
  }, [searchParams, update, router]);

  // Don't render if session hasn't loaded yet, user is verified, or banner was dismissed this session
  if (!session || session.user.emailVerified || dismissed) return null;

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" });
      const data = await res.json() as { ok?: boolean; skipped?: boolean; error?: string };
      if (!res.ok) {
        showError("Failed to send", data.error ?? "Could not resend verification email");
      } else if (data.skipped) {
        showSuccess("Already verified", "Your email is already verified.");
        update();
      } else {
        showSuccess("Email sent", "A new verification link has been sent to your inbox.");
      }
    } catch {
      showError("Failed to send", "Could not resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json() as { ok?: boolean; email?: string; error?: string };
      if (!res.ok) {
        showError("Could not update email", data.error ?? "Please try again.");
      } else {
        showSuccess("Email updated", `Verification link sent to ${data.email}.`);
        setChangingEmail(false);
        setNewEmail("");
        // Force session refresh so banner reflects the new email address
        await update();
      }
    } catch {
      showError("Could not update email", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-8 mb-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      {/* Main row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <MailWarning className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-amber-900">
              Please verify your email address
            </p>
            <p className="text-[12px] text-amber-700">
              Sent to <span className="font-medium">{session.user.email}</span>.{" "}
              Check your inbox or{" "}
              <button
                onClick={() => { setChangingEmail((v) => !v); setNewEmail(""); }}
                className="underline underline-offset-2 hover:text-amber-900 transition-colors"
              >
                wrong email?
              </button>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resending}
            className="h-8 gap-1.5 rounded-lg border-amber-300 bg-white text-[12px] font-medium text-amber-800 hover:bg-amber-50"
          >
            <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending..." : "Resend"}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline change-email form */}
      {changingEmail && (
        <form
          onSubmit={handleChangeEmail}
          className="mt-3 flex items-center gap-2 border-t border-amber-200 pt-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100">
            <Pencil className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <Input
            type="email"
            placeholder="Enter correct email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoFocus
            className="h-8 flex-1 rounded-lg border-amber-300 bg-white text-[13px] placeholder:text-amber-400 focus-visible:ring-amber-400/30"
          />
          <Button
            type="submit"
            size="sm"
            disabled={saving || !newEmail.trim()}
            className="h-8 gap-1.5 rounded-lg bg-amber-600 px-3 text-[12px] font-semibold text-white hover:bg-amber-700"
          >
            <ArrowRight className="h-3 w-3" />
            {saving ? "Saving..." : "Update & resend"}
          </Button>
          <button
            type="button"
            onClick={() => { setChangingEmail(false); setNewEmail(""); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
