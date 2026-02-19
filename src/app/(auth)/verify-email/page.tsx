"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, PartyPopper } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-[14px] text-text-secondary">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Confetti burst helper                                              */
/* ------------------------------------------------------------------ */
function fireCelebration() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ef4444", "#f97316", "#22c55e", "#3b82f6", "#a855f7"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ef4444", "#f97316", "#22c55e", "#3b82f6", "#a855f7"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  // Big initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ef4444", "#f97316", "#22c55e", "#3b82f6", "#a855f7"],
  });
  frame();
}

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const fromLogin = searchParams.get("from") === "login";
  const alreadyConfirmed = searchParams.get("confirmed") === "true";
  const userName = searchParams.get("name") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(alreadyConfirmed);
  const [celebrationDone, setCelebrationDone] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredConfetti = useRef(false);

  // ---- Celebration trigger ----
  const triggerCelebration = useCallback(() => {
    if (hasFiredConfetti.current) return;
    hasFiredConfetti.current = true;
    setVerified(true);

    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    fireCelebration();

    // Send welcome email (fire-and-forget)
    fetch("/api/email/welcome", { method: "POST" }).catch(() => {});

    // Auto-redirect after celebration
    setTimeout(() => {
      setCelebrationDone(true);
      router.push("/onboarding");
      router.refresh();
    }, 3500);
  }, [router]);

  // ---- If arrived with confirmed=true, fire immediately ----
  useEffect(() => {
    if (alreadyConfirmed) {
      triggerCelebration();
    }
  }, [alreadyConfirmed, triggerCelebration]);

  // ---- Listen for cross-tab session (email confirmed in another tab) ----
  useEffect(() => {
    if (verified || alreadyConfirmed || fromLogin) return;

    const supabase = createClient();
    if (!supabase) return;

    // Supabase syncs sessions across tabs via localStorage.
    // When the confirmation link creates a session in another tab,
    // onAuthStateChange fires SIGNED_IN here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          triggerCelebration();
        }
      }
    );

    // Also poll as a fallback (e.g. if user confirmed via a different browser)
    pollingRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          triggerCelebration();
        }
      } catch {
        // ignore polling errors
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [verified, alreadyConfirmed, fromLogin, triggerCelebration]);

  // Start cooldown on mount (skip for from=login so user can resend immediately)
  useEffect(() => {
    if (!fromLogin && !alreadyConfirmed) setResendCooldown(60);
  }, [fromLogin, alreadyConfirmed]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    if (!verified && !fromLogin) inputRefs.current[0]?.focus();
  }, [verified, fromLogin]);

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

    triggerCelebration();
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

  /* ---------------------------------------------------------------- */
  /*  No email → fallback                                             */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  Celebration screen                                               */
  /* ---------------------------------------------------------------- */
  if (verified) {
    const displayName = userName || email.split("@")[0];
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="mb-2 flex items-center justify-center gap-2">
              <PartyPopper className="h-6 w-6 text-amber-500" />
              <h1 className="text-[28px] font-bold text-text-primary">
                Congratulations!
              </h1>
              <PartyPopper className="h-6 w-6 text-amber-500 -scale-x-100" />
            </div>

            <p className="text-[16px] font-medium text-text-primary">
              Welcome aboard, {displayName}!
            </p>
            <p className="mt-2 text-[14px] text-text-secondary">
              Your email has been verified successfully.
            </p>
            <p className="mt-1 text-[14px] text-text-secondary">
              Let&apos;s set up your workspace now.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center gap-2 text-[13px] text-text-meta">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              {celebrationDone ? "Redirecting..." : "Taking you to setup..."}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  From login: unconfirmed email screen                             */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  Default: OTP entry screen                                        */
  /* ---------------------------------------------------------------- */
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

      {/* Waiting indicator */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-text-meta">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        Listening for email confirmation...
      </div>

      {/* OTP Input */}
      <div className="mt-6 flex justify-center gap-2.5" onPaste={handlePaste}>
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
        {loading ? "Verifying..." : "Verify Email"}
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
