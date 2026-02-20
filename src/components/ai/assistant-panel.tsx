"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Maximize2, X } from "lucide-react";
import { SuggestionChip } from "./suggestion-chip";
import { AIInputBar } from "./ai-input-bar";
import { AiAvatar } from "./ai-avatar";

type ChipSet = { text: string; query: string }[];

const contextChips: Record<string, ChipSet> = {
  "/dashboard": [
    { text: "What is our gross margin %?", query: "What is our gross margin %?" },
    { text: "How can we improve our cash flow?", query: "How can we improve our cash flow?" },
    { text: "Why did gross margin change during the period?", query: "Why did gross margin change during the period?" },
  ],
  "/sales": [
    { text: "Summarize overdue invoices", query: "Summarize overdue invoices" },
    { text: "Which customer owes the most?", query: "Which customer owes the most?" },
    { text: "How can we improve our cash flow?", query: "How can we improve our cash flow?" },
  ],
  "/purchases": [
    { text: "What are my top expense categories?", query: "What are my top expense categories?" },
    { text: "Any duplicate bills?", query: "Any duplicate bills?" },
    { text: "How can we improve our cash flow?", query: "How can we improve our cash flow?" },
  ],
  "/banking": [
    { text: "Show unreconciled transactions", query: "Show unreconciled transactions" },
    { text: "Suggest GL matches for bank transactions", query: "Suggest GL matches for bank transactions" },
    { text: "Categorize pending bank items", query: "Categorize pending bank items" },
  ],
  "/vat": [
    { text: "Estimate my Q1 VAT liability", query: "Estimate my Q1 VAT liability" },
    { text: "What is our gross margin %?", query: "What is our gross margin %?" },
  ],
  "/inventory": [
    { text: "Show low stock items", query: "Show low stock items" },
    { text: "What are my top expense categories?", query: "What are my top expense categories?" },
  ],
  "/documents": [
    { text: "Show me all Starbucks receipts from January", query: "Show me all Starbucks receipts from January" },
    { text: "Find invoices over 50,000", query: "Find invoices over 50,000" },
    { text: "Any duplicate bills?", query: "Any duplicate bills?" },
  ],
};

function getChipsForPath(pathname: string): ChipSet {
  for (const [prefix, chips] of Object.entries(contextChips)) {
    if (pathname.startsWith(prefix)) return chips;
  }
  return contextChips["/dashboard"];
}

export function AssistantPanel() {
  const pathname = usePathname();
  const [response, setResponse] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuery(query: string) {
    setThinking(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: { pathname },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 402) {
          setError("Out of tokens. Upgrade or refill to continue.");
        } else if (res.status === 403) {
          setError("Assistant is unavailable in archive mode.");
        } else {
          setError(data?.error ?? "Something went wrong. Please try again.");
        }
        setThinking(false);
        return;
      }

      setResponse(data?.reply ?? "I couldn't generate a response. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-[540px] -translate-x-1/2">
      <div className="glass-dark rounded-3xl px-5 pb-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AiAvatar size="sm" showRing showGlow />
            <h3 className="text-[15px] font-semibold text-white">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            {(response || error) && (
              <button
                onClick={() => {
                  setResponse(null);
                  setError(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/80"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
            <button
              onClick={() => {
                import("@/lib/utils/toast-helpers").then((m) => m.comingSoon("Expand AI Assistant"));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/80"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && !thinking && (
          <div className="mt-3 rounded-xl bg-amber-500/20 px-3.5 py-3 text-[13px] text-amber-200">
            {error}
          </div>
        )}

        {/* AI Response area */}
        {thinking && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
            <span className="inline-flex gap-1">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            Analyzing your data...
          </div>
        )}

        {response && !thinking && (
          <div className="mt-3 max-h-[120px] overflow-y-auto rounded-xl bg-white/5 px-3.5 py-3 text-[13px] leading-relaxed text-white/80">
            {response.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1" : ""}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Context-aware suggestion chips */}
        {!response && !thinking && !error && (
          <div className="mt-3 flex flex-wrap gap-2">
            {getChipsForPath(pathname).map((chip) => (
              <SuggestionChip key={chip.text} text={chip.text} onClick={() => handleQuery(chip.query)} />
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="mt-3">
          <AIInputBar onSubmit={handleQuery} />
        </div>
      </div>
    </div>
  );
}
