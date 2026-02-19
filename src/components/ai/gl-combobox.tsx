"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GLAccount {
  id: string;
  code: string;
  name: string;
}

interface GLComboboxProps {
  accounts: GLAccount[];
  value: string;
  onChange: (accountId: string) => void;
  aiSuggestion?: { accountId: string; confidence: number } | null;
  className?: string;
  required?: boolean;
}

export function GLCombobox({
  accounts,
  value,
  onChange,
  aiSuggestion,
  className,
  required,
}: GLComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = accounts.find((a) => a.id === value);
  const suggestedAccount = aiSuggestion
    ? accounts.find((a) => a.id === aiSuggestion.accountId)
    : null;

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-border-subtle bg-surface px-3 text-left text-[13px] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/30",
          "hover:border-border-subtle/80",
          !selected && "text-text-meta",
        )}
      >
        <span className="truncate">
          {selected ? `${selected.code} — ${selected.name}` : "Select account"}
        </span>
        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-text-meta" />
      </button>
      {required && <input type="text" required value={value} onChange={() => {}} className="sr-only" tabIndex={-1} />}

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border-subtle bg-surface shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-meta" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GL accounts..."
              className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-meta"
            />
          </div>

          {/* AI Suggestion */}
          {suggestedAccount && !search && (
            <button
              type="button"
              onClick={() => {
                onChange(suggestedAccount.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex w-full items-center gap-2 border-b border-border-subtle bg-[var(--accent-ai)]/5 px-3 py-2.5 text-left hover:bg-[var(--accent-ai)]/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-ai)]" />
              <div className="flex-1">
                <span className="text-[12px] font-semibold text-[var(--accent-ai)]">AI Suggestion</span>
                <p className="text-[13px] text-text-primary">
                  {suggestedAccount.code} — {suggestedAccount.name}
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent-ai)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-ai)]">
                {Math.round(aiSuggestion!.confidence * 100)}%
              </span>
            </button>
          )}

          {/* Account list */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-[12px] text-text-meta">
                No accounts found
              </p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onChange(a.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]",
                    a.id === value && "bg-text-primary/5 font-medium",
                  )}
                >
                  <span className="font-mono text-[12px] text-text-meta">{a.code}</span>
                  <span className="text-text-primary">{a.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
