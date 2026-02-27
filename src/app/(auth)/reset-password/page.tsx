"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { AuthMobileLogo } from "@/components/auth/auth-mobile-logo";
import { PasswordInput } from "@/components/auth/password-input";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-[14px] text-text-secondary">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
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
    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to reset password");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/login");
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
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div>
      <AuthMobileLogo />

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
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
            className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
          />
          <p className="mt-1 text-[11px] text-text-meta">Minimum 8 characters</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
            Confirm Password
          </label>
          <PasswordInput
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
          className="h-11 w-full gap-2 rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
