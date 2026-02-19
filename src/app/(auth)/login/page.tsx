"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured. Use Quick Login for demo mode.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <span className="text-[17px] font-bold text-text-primary">
            AccountingAI
          </span>
        </div>

        <h1 className="text-[24px] font-bold text-text-primary">Welcome back</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Sign in to your account to continue
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-ai)]/5 px-3 py-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          <p className="text-[12px] font-medium text-[var(--accent-ai)]">
            AI-Powered Accounting for UAE Businesses
          </p>
        </div>

        {/* Quick Login */}
        <Button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-[15px] font-semibold text-white hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}><path d="M13 5l7 7-7 7M5 12h14" /></svg>
          Quick Login — Demo Mode
        </Button>
        <p className="mt-2 text-center text-[11px] text-text-meta">
          Skip authentication and explore with sample UAE business data
        </p>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[11px] font-medium text-text-meta">OR SIGN IN WITH EMAIL</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
            />
          </div>

          {error && (
            <p className="text-[13px] text-error">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
