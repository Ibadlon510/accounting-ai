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

  async function handleGoogleLogin() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

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
    <div>
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
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

      <h1 className="text-[24px] font-bold text-text-primary">Welcome back</h1>
      <p className="mt-1 text-[14px] text-text-secondary">
        Sign in to your account to continue
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-ai)]/5 px-3 py-2">
        <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
        <p className="text-[12px] font-medium text-[var(--accent-ai)]">
          AI-Powered Smart Accounting for Businesses
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
        Skip authentication and explore with sample business data
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="mt-3 h-11 w-full gap-2 rounded-xl border-border-subtle text-[14px] font-medium text-text-primary hover:bg-black/5"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>

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
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[13px] font-medium text-text-primary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-text-secondary hover:text-text-primary"
            >
              Forgot password?
            </Link>
          </div>
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
  );
}
