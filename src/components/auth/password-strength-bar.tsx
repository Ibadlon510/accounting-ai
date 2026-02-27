"use client";

import { cn } from "@/lib/utils";

function getStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  return 3;
}

const LABELS = ["", "Weak", "Fair", "Strong"] as const;
const COLORS = [
  "",
  "bg-red-400",
  "bg-amber-400",
  "bg-emerald-500",
] as const;
const TEXT_COLORS = [
  "",
  "text-red-500",
  "text-amber-600",
  "text-emerald-600",
] as const;

interface PasswordStrengthBarProps {
  password: string;
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              strength >= level ? COLORS[strength] : "bg-border-subtle"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", TEXT_COLORS[strength])}>
        {LABELS[strength]} password
      </p>
    </div>
  );
}
