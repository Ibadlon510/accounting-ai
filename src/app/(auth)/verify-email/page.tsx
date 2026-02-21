"use client";

import { Suspense, useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper } from "lucide-react";
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
  const alreadyConfirmed = searchParams.get("confirmed") === "true";
  const userName = searchParams.get("name") ?? "";

  const [celebrationDone, setCelebrationDone] = useState(false);
  const hasFiredConfetti = useRef(false);

  const triggerCelebration = useCallback(() => {
    if (hasFiredConfetti.current) return;
    hasFiredConfetti.current = true;

    fireCelebration();

    // Send welcome email (fire-and-forget)
    fetch("/api/email/welcome", { method: "POST" }).catch(() => {});

    setTimeout(() => {
      setCelebrationDone(true);
      router.push("/onboarding");
      router.refresh();
    }, 3500);
  }, [router]);

  useEffect(() => {
    if (alreadyConfirmed) {
      triggerCelebration();
    }
  }, [alreadyConfirmed, triggerCelebration]);

  if (!email && !alreadyConfirmed) {
    return (
      <div className="text-center">
        <p className="text-[14px] text-text-secondary">No email provided.</p>
        <Link href="/signup" className="mt-3 inline-block text-[13px] font-medium text-text-primary hover:underline">
          Go to Sign Up
        </Link>
      </div>
    );
  }

  const displayName = userName || email?.split("@")[0] || "there";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
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
              Welcome!
            </h1>
            <PartyPopper className="h-6 w-6 text-amber-500 -scale-x-100" />
          </div>

          <p className="text-[16px] font-medium text-text-primary">
            Welcome aboard, {displayName}!
          </p>
          <p className="mt-2 text-[14px] text-text-secondary">
            Your account has been created successfully.
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
          {alreadyConfirmed ? (
            <div className="flex items-center justify-center gap-2 text-[13px] text-text-meta">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              {celebrationDone ? "Redirecting..." : "Taking you to setup..."}
            </div>
          ) : (
            <Button
              onClick={() => { router.push("/onboarding"); router.refresh(); }}
              className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
            >
              Continue to Setup
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
