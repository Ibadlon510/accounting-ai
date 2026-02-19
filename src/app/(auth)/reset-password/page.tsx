"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-light)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--success)]" />
        </div>
        <h1 className="text-[22px] font-bold text-text-primary">Password updated</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[17px] font-bold text-text-primary">Agar</span>
          <span className="text-[12px] font-medium text-text-secondary">Smart Accounting</span>
        </div>
      </div>

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-ai)]/10">
        <Lock className="h-7 w-7 text-[var(--accent-ai)]" />
      </div>

      <h1 className="text-center text-[24px] font-bold text-text-primary">
        Set new password
      </h1>
      <p className="mt-1 text-center text-[14px] text-text-secondary">
        Choose a strong password for your account
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
            New Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
          />
          <p className="mt-1 text-[11px] text-text-meta">Minimum 8 characters</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
            Confirm Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
          />
        </div>

        {error && <p className="text-[13px] text-error">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
