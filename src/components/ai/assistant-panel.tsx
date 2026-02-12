"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { SuggestionChip } from "./suggestion-chip";
import { AIInputBar } from "./ai-input-bar";
import { AiAvatar } from "./ai-avatar";

const aiResponses: Record<string, string> = {
  "What is our gross margin %?":
    "Your gross margin is approximately 92%. Total revenue is AED 530,250 with COGS of AED 41,040, yielding a gross profit of AED 489,210. This is well above the industry average of 65% for IT consulting firms in the UAE.",
  "How can we improve our cash flow?":
    "I see AED 462,750 in outstanding receivables. Here are 3 quick wins:\n1. Follow up on the ADNOC overdue invoice (AED 78,750 — 30 days past due)\n2. Offer 2% early payment discount to Dubai Holding (AED 210,000)\n3. Negotiate longer payment terms with Gulf IT Solutions (AED 15,750 payable)",
  "Why did gross margin change during the period?":
    "Gross margin improved by 3.2% this quarter primarily due to a shift toward higher-margin service revenue (IT consulting at 85%+ margin) and reduced hardware purchases. Your service-to-product mix moved from 70:30 to 85:15.",
};

export function AssistantPanel() {
  const [response, setResponse] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  function handleQuery(query: string) {
    setThinking(true);
    setResponse(null);
    setTimeout(() => {
      setThinking(false);
      setResponse(
        aiResponses[query] ||
          `Based on your current data, I'd need to analyze this further. Your total revenue is AED 530,250, expenses are AED 41,040, and bank balance is AED 647,150. Could you be more specific about what you'd like to know?`
      );
    }, 1200);
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
            {response && (
              <button
                onClick={() => setResponse(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/80"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
            <button onClick={() => { import("@/lib/utils/toast-helpers").then(m => m.comingSoon("Expand AI Assistant")); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/80">
              <Maximize2 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* AI Response area */}
        {thinking && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "300ms" }} />
            </span>
            Analyzing your data...
          </div>
        )}

        {response && !thinking && (
          <div className="mt-3 max-h-[120px] overflow-y-auto rounded-xl bg-white/5 px-3.5 py-3 text-[13px] leading-relaxed text-white/80">
            {response.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        {!response && !thinking && (
          <div className="mt-3 flex flex-wrap gap-2">
            <SuggestionChip text="What is our gross margin %?" onClick={() => handleQuery("What is our gross margin %?")} />
            <SuggestionChip text="How can we improve our cash flow?" onClick={() => handleQuery("How can we improve our cash flow?")} />
            <SuggestionChip text="Why did gross margin change during the period?" onClick={() => handleQuery("Why did gross margin change during the period?")} />
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
