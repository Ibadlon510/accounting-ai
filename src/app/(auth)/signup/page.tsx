"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured. Use Quick Login on the login page for demo mode.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If session exists, email confirmation is disabled — go straight in
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    // Otherwise, email confirmation is required — show message
    setEmailSent(true);
    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="dashboard-card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-green-600" stroke="currentColor" strokeWidth={2}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-text-primary">Check your email</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
            We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <Link href="/login">
            <Button className="mt-6 h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="dashboard-card">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
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

        <h1 className="text-[24px] font-bold text-text-primary">
          Create your account
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Get started with AI-powered accounting
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Ahmed Al Mansoori"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@company.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Password
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
          </div>

          {error && <p className="text-[13px] text-error">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
