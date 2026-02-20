"use client";

import { useState } from "react";
import { HelpCircle, LayoutGrid, SendHorizonal } from "lucide-react";
import { AiAvatar } from "./ai-avatar";
import { comingSoon } from "@/lib/utils/toast-helpers";

interface AIInputBarProps {
  onSubmit?: (query: string) => void;
}

export function AIInputBar({ onSubmit }: AIInputBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <AiAvatar size="sm" showGlow />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything or search..."
        className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/40 outline-none"
      />
      <div className="flex items-center gap-1">
        {value.trim() && (
          <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white">
            <SendHorizonal className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
        <button type="button" onClick={() => comingSoon("AI Help")} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70">
          <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button type="button" onClick={() => comingSoon("AI Commands")} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70">
          <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </form>
  );
}
