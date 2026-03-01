"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { AuthMobileLogo } from "@/components/auth/auth-mobile-logo";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthBar } from "@/components/auth/password-strength-bar";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignup() {
    await signIn("google", { callbackUrl: "/workspaces" });
  }

  async function handleMicrosoftSignup() {
    await signIn("microsoft-entra-id", { callbackUrl: "/workspaces" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    let data: { error?: string; ok?: boolean; userId?: string } = {};
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { /* non-JSON */ }
    }
    if (!res.ok) {
      setError(data.error ?? "Failed to create account");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but login failed. Please sign in manually.");
      setLoading(false);
      return;
    }

    router.push("/workspaces");
    router.refresh();
  }

  return (
    <div>
      <AuthMobileLogo />

      <h1 className="text-[24px] font-bold text-text-primary">
        Create your account
      </h1>
      <p className="mt-1 text-[14px] text-text-secondary">
        Get started with AI-powered accounting
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
          className="h-11 w-full gap-2 rounded-xl border-border-subtle text-[14px] font-medium text-text-primary hover:bg-black/5"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleMicrosoftSignup}
          className="h-11 w-full gap-2 rounded-xl border-border-subtle text-[14px] font-medium text-text-primary hover:bg-black/5"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          Continue with Microsoft
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-[11px] font-medium text-text-meta">OR SIGN UP WITH EMAIL</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
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
            autoFocus
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
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
          />
          <PasswordStrengthBar password={password} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
            Confirm Password
          </label>
          <PasswordInput
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-[11px] text-error">Passwords do not match</p>
          )}
        </div>

        {error && <p className="text-[13px] text-error">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full gap-2 rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-text-meta">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-text-secondary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-text-secondary">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
