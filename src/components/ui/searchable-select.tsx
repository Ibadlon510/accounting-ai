"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = { value: string; label: string };

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchPlaceholder?: string;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  allowEmpty,
  emptyLabel = "— None —",
  searchPlaceholder = "Search...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return o.label.toLowerCase().includes(q);
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
          if (!open) {
            setSearch("");
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-border-subtle bg-surface px-3 text-left text-[13px] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/30",
          "hover:border-border-subtle/80",
          !selected && "text-text-meta"
        )}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-text-meta" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border-subtle bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-meta" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-meta"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto py-1">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-meta hover:bg-black/[0.03]"
              >
                {emptyLabel}
              </button>
            )}
            {allowEmpty && filtered.length > 0 && (
              <div className="my-1 border-t border-border-subtle" />
            )}
            {filtered.length === 0 ? (
              !allowEmpty || search ? (
                <p className="px-3 py-3 text-center text-[12px] text-text-meta">
                  {search ? "No matches" : "No options"}
                </p>
              ) : null
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]",
                    opt.value === value && "bg-text-primary/5 font-medium"
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
