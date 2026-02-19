"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-[14px] text-text-secondary">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const fromLogin = searchParams.get("from") === "login";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown on mount (skip for from=login so user can resend immediately)
  useEffect(() => {
    if (!fromLogin) setResendCooldown(60);
  }, [fromLogin]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && next.every((d) => d)) {
      handleVerify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  }

  async function handleVerify(token?: string) {
    const code = token ?? otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    setVerified(true);
    router.push("/onboarding");
    router.refresh();
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured");
      setResendLoading(false);
      return;
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResendCooldown(60);
    }
    setResendLoading(false);
  }

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-[14px] text-text-secondary">No email provided.</p>
        <Link href="/signup" className="mt-3 inline-block text-[13px] font-medium text-text-primary hover:underline">
          Go to Sign Up
        </Link>
      </div>
    );
  }

  // From login: unconfirmed email — show simple "resend confirmation link" screen
  if (fromLogin) {
    return (
      <div>
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold text-text-primary">Agar</span>
            <span className="text-[12px] font-medium text-text-secondary">Smart Accounting</span>
          </div>
        </div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <Mail className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-center text-[24px] font-bold text-text-primary">
          Email not confirmed
        </h1>
        <p className="mt-1 text-center text-[14px] text-text-secondary">
          We need to verify <strong className="text-text-primary">{email}</strong> before you can sign in.
          Click below to resend the confirmation link.
        </p>
        {error && <p className="mt-3 text-center text-[13px] text-error">{error}</p>}
        <Button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="mt-6 h-11 w-full gap-2 rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? "animate-spin" : ""}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? "Sending..." : "Resend confirmation email"}
        </Button>
        <p className="mt-4 text-center text-[12px] text-text-meta">
          Check your inbox and spam folder. Click the link in the email to confirm, then sign in again.
        </p>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
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

      {/* Email icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-ai)]/10">
        <Mail className="h-7 w-7 text-[var(--accent-ai)]" />
      </div>

      <h1 className="text-center text-[24px] font-bold text-text-primary">
        Check your email
      </h1>
      <p className="mt-1 text-center text-[14px] text-text-secondary">
        We sent a 6-digit code to{" "}
        <strong className="text-text-primary">{email}</strong>
      </p>

      {/* OTP Input */}
      <div className="mt-8 flex justify-center gap-2.5" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading || verified}
            className="h-14 w-12 rounded-xl border border-border-subtle bg-transparent text-center text-[22px] font-bold text-text-primary outline-none transition-all focus:border-text-primary focus:ring-2 focus:ring-text-primary/20 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="mt-3 text-center text-[13px] text-error">{error}</p>}

      <Button
        onClick={() => handleVerify()}
        disabled={loading || verified || otp.some((d) => !d)}
        className="mt-6 h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
      >
        {verified ? "Verified! Redirecting..." : loading ? "Verifying..." : "Verify Email"}
      </Button>

      {/* Resend */}
      <div className="mt-5 text-center">
        <p className="text-[13px] text-text-secondary">
          Didn&apos;t receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-primary hover:underline disabled:text-text-meta disabled:no-underline"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? "animate-spin" : ""}`} />
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : resendLoading
              ? "Sending..."
              : "Resend code"}
        </button>
      </div>

      <p className="mt-4 text-center text-[12px] text-text-meta">
        You can also click the confirmation link in your email
      </p>

      {/* Back to signup */}
      <div className="mt-6 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign Up
        </Link>
      </div>
    </div>
  );
}
