"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReviewDoc {
  id: string;
  fileName: string;
  status: string;
  aiConfidence: number | null;
  merchantName?: string;
  totalAmount?: number;
  date?: string;
}

interface StackedReviewProps {
  documents: ReviewDoc[];
  onVerify: (docId: string) => void;
  onSkip: (docId: string) => void;
  className?: string;
}

export function StackedReview({ documents, onVerify, onSkip, className }: StackedReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (documents.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-center", className)}>
        <div>
          <ShieldCheck className="mx-auto h-10 w-10 text-success mb-3" />
          <p className="text-[15px] font-semibold text-text-primary">All caught up!</p>
          <p className="mt-1 text-[13px] text-text-secondary">No documents need review.</p>
        </div>
      </div>
    );
  }

  const doc = documents[currentIndex];
  const confidence = doc.aiConfidence ?? 0;
  const isHigh = confidence >= 0.9;
  const isMed = confidence >= 0.7;

  function next() {
    if (currentIndex < documents.length - 1) setCurrentIndex((i) => i + 1);
  }

  function prev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-primary">
          {currentIndex + 1} of {documents.length}
        </p>
        <div className="flex gap-1">
          {documents.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentIndex ? "w-6 bg-[var(--accent-ai)]" : "w-1.5 bg-border-subtle",
              )}
            />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative">
        {/* Background cards (peek) */}
        {currentIndex < documents.length - 1 && (
          <div className="absolute inset-x-2 top-2 h-full rounded-2xl bg-surface border border-border-subtle opacity-60" />
        )}
        {currentIndex < documents.length - 2 && (
          <div className="absolute inset-x-4 top-4 h-full rounded-2xl bg-surface border border-border-subtle opacity-30" />
        )}

        {/* Active card */}
        <div className="relative dashboard-card">
          {/* Confidence badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-mono text-text-meta">{doc.fileName}</span>
            {doc.aiConfidence != null && (
              <span className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                isHigh ? "bg-success/10 text-success" :
                isMed ? "bg-amber-500/10 text-amber-700" :
                "bg-error/10 text-error"
              )}>
                {isHigh ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          {/* Document summary */}
          <div className="space-y-3">
            {doc.merchantName && (
              <div>
                <p className="text-[11px] text-text-meta">Merchant</p>
                <p className="text-[16px] font-semibold text-text-primary">{doc.merchantName}</p>
              </div>
            )}
            <div className="flex gap-6">
              {doc.totalAmount != null && (
                <div>
                  <p className="text-[11px] text-text-meta">Amount</p>
                  <p className="text-[18px] font-bold text-text-primary">AED {doc.totalAmount.toLocaleString()}</p>
                </div>
              )}
              {doc.date && (
                <div>
                  <p className="text-[11px] text-text-meta">Date</p>
                  <p className="text-[14px] font-medium text-text-primary">{doc.date}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] text-text-meta">Status</p>
              <p className="text-[13px] font-medium text-text-primary capitalize">{doc.status.toLowerCase().replace("_", " ")}</p>
            </div>
          </div>

          {/* AI suggestion hint */}
          {isHigh && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-ai)]/5 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-ai)]" />
              <p className="text-[12px] text-[var(--accent-ai)]">
                High confidence — AI recommends auto-filing this document.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => onVerify(doc.id)}
              className="flex-1 gap-1.5 rounded-xl bg-success text-[13px] font-semibold text-white hover:bg-success/90"
            >
              <ShieldCheck className="h-4 w-4" /> Verify
            </Button>
            <Button
              onClick={() => {
                onSkip(doc.id);
                next();
              }}
              variant="outline"
              className="rounded-xl text-[13px]"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-black/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          disabled={currentIndex === documents.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary disabled:opacity-30 hover:bg-black/5"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
