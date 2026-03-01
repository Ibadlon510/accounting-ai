"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Minimize2,
  X,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Crown,
} from "lucide-react";
import { SuggestionChip } from "./suggestion-chip";
import { AIInputBar, type FileUploadState } from "./ai-input-bar";
import { AiAvatar } from "./ai-avatar";
import { UpgradeModal } from "@/components/overlays/upgrade-modal";

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

// ─── Step indicator for expanded upload flow ────────────────
const STEPS = ["Upload", "AI Processing", "Review"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold transition-all ${
              i < current
                ? "bg-emerald-500/20 text-emerald-400"
                : i === current
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/30"
            }`}
          >
            {i < current ? <CheckCircle className="h-3 w-3" /> : null}
            {label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-3 ${i < current ? "bg-emerald-400/40" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Extraction result card (shared collapsed/expanded) ─────
function ExtractionResultCard({
  fileState,
  compact,
}: {
  fileState: FileUploadState;
  compact?: boolean;
}) {
  const ext = fileState.extractedData as
    | {
        merchant?: { name?: string };
        invoice?: { date?: string; total_amount?: number; currency?: string; tax_amount?: number; net_amount?: number };
        gl_prediction?: { code?: string; confidence?: number };
        validation?: { math_check_passed?: boolean; issues?: string[] };
      }
    | undefined;

  const merchant = ext?.merchant?.name ?? "Unknown";
  const total = ext?.invoice?.total_amount;
  const currency = ext?.invoice?.currency ?? "AED";
  const tax = ext?.invoice?.tax_amount;
  const glCode = ext?.gl_prediction?.code;
  const confidence = fileState.confidence ?? ext?.gl_prediction?.confidence;
  const confPct = confidence != null ? Math.round(confidence * 100) : null;

  if (compact) {
    return (
      <div className="mt-3 rounded-xl bg-emerald-500/10 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate text-[13px] font-medium text-emerald-300">{merchant}</span>
          </div>
          {confPct != null && (
            <span className="ml-2 shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {confPct}%
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-white/60">
          {total != null && <span>{currency} {total.toLocaleString()}</span>}
          {tax != null && <span>VAT: {currency} {tax.toLocaleString()}</span>}
          {glCode && <span className="truncate">{glCode}</span>}
        </div>
        {fileState.documentId && (
          <Link
            href={`/documents/${fileState.documentId}/verify`}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            Verify & Book <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }

  // Expanded result card
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-white">{merchant}</h4>
        {confPct != null && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              confPct >= 80
                ? "bg-emerald-500/20 text-emerald-400"
                : confPct >= 50
                ? "bg-amber-500/20 text-amber-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {confPct}% confidence
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {ext?.invoice?.date && (
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Date</p>
            <p className="text-[13px] font-medium text-white/80">{ext.invoice.date}</p>
          </div>
        )}
        {total != null && (
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Total</p>
            <p className="text-[13px] font-medium text-white/80">{currency} {total.toLocaleString()}</p>
          </div>
        )}
        {ext?.invoice?.net_amount != null && (
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Net</p>
            <p className="text-[13px] font-medium text-white/80">{currency} {ext.invoice.net_amount.toLocaleString()}</p>
          </div>
        )}
        {tax != null && (
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">VAT</p>
            <p className="text-[13px] font-medium text-white/80">{currency} {tax.toLocaleString()}</p>
          </div>
        )}
      </div>

      {glCode && (
        <div className="mt-2 rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/40">GL Prediction</p>
          <p className="text-[13px] font-medium text-white/80">{glCode}</p>
        </div>
      )}

      {ext?.validation?.issues && ext.validation.issues.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2">
          <p className="text-[11px] font-medium text-amber-300">
            {ext.validation.issues.join("; ")}
          </p>
        </div>
      )}

      {fileState.documentId && (
        <Link
          href={`/documents/${fileState.documentId}/verify`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5 text-[13px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30"
        >
          Verify & Book <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Upload progress display ────────────────────────────────
function UploadProgress({
  fileState,
  onDismiss,
  onRetry,
  compact,
}: {
  fileState: FileUploadState;
  onDismiss: () => void;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (fileState.status === "done") {
    return <ExtractionResultCard fileState={fileState} compact={compact} />;
  }

  const isUploading = fileState.status === "uploading";
  const isExtracting = fileState.status === "extracting";
  const isError = fileState.status === "error";
  const stepIndex = isUploading ? 0 : isExtracting ? 1 : isError ? -1 : 2;
  const canRetry = isError && !!fileState.documentId;

  return (
    <div className="mt-3">
      {!compact && <StepIndicator current={stepIndex} />}
      <div className={`${!compact ? "mt-2" : ""} flex items-center gap-3 rounded-xl ${isError ? "bg-red-500/10" : "bg-white/5"} px-3.5 py-3`}>
        {isError ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-white/70">{fileState.fileName}</p>
          <p className={`text-[11px] ${isError ? "text-red-400" : "text-white/40"}`}>
            {isUploading && "Uploading to vault..."}
            {isExtracting && "AI extracting data..."}
            {isError && (fileState.error ?? "Processing failed")}
          </p>
        </div>
        {isError && (
          <div className="flex items-center gap-1">
            {canRetry && (
              <button
                onClick={onRetry}
                className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/20 hover:text-white"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 hover:text-white/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Expanded drop zone (dark-themed) ───────────────────────
function ExpandedDropZone({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed transition-all ${
        dragging
          ? "border-emerald-400/50 bg-emerald-400/5 scale-[1.01]"
          : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
      } px-6 py-6 text-center`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFilesSelected(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <CloudUpload className={`mx-auto h-8 w-8 ${dragging ? "text-emerald-400" : "text-white/20"}`} />
      <p className="mt-2 text-[13px] font-medium text-white/60">
        {dragging ? "Drop files here" : "Drop invoices, receipts, or credit notes"}
      </p>
      <p className="mt-1 text-[11px] text-white/30">PDF, JPEG, PNG, WebP — up to 10 MB</p>
    </div>
  );
}

// ─── FAB Upgrade Bubble messages ─────────────────────────────
const UPGRADE_MESSAGES = [
  "Unlock unlimited AI scans",
  "Get 150 AI tokens/month",
  "50% off Pro — limited time",
  "Unlimited journal entries",
];

const DISMISS_KEY = "agar_upgrade_dismissed";

// ─── Main Panel ─────────────────────────────────────────────
export function AssistantPanel() {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(true);
  const [response, setResponse] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileState, setFileState] = useState<FileUploadState | null>(null);

  // Pro upgrade nudge state
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Fetch plan on mount
  useEffect(() => {
    fetch("/api/org/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.subscriptionPlan) {
          setSubscriptionPlan(d.subscriptionPlan);
          const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
          setBubbleDismissed(wasDismissed);
          setBannerDismissed(wasDismissed);
        }
      })
      .catch(() => {});
  }, []);

  const isFreePlan = subscriptionPlan === "FREE";

  // FAB bubble: delayed entrance + message rotation
  useEffect(() => {
    if (!isFreePlan || bubbleDismissed || !isMinimized) return;
    const showTimer = setTimeout(() => setBubbleVisible(true), 3000);
    return () => clearTimeout(showTimer);
  }, [isFreePlan, bubbleDismissed, isMinimized]);

  useEffect(() => {
    if (!bubbleVisible) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % UPGRADE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bubbleVisible]);

  function dismissUpgradeNudge() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setBubbleDismissed(true);
    setBubbleVisible(false);
    setBannerDismissed(true);
  }

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

  // Handle files dropped in expanded view (trigger same upload+process pipeline)
  async function handleExpandedFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setFileState({ fileName: file.name, status: "error", error: "Only PDF, JPEG, PNG, WebP allowed." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileState({ fileName: file.name, status: "error", error: "File too large (max 10 MB)." });
      return;
    }
    setFileState({ fileName: file.name, status: "uploading" });
    const formData = new FormData();
    formData.set("file", file);
    try {
      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        setFileState({ fileName: file.name, status: "error", error: data.error ?? "Upload failed." });
        return;
      }
      const { documentId } = await uploadRes.json();
      setFileState({ fileName: file.name, status: "extracting", documentId });
      const processRes = await fetch(`/api/documents/${documentId}/process`, { method: "POST" });
      if (!processRes.ok) {
        const data = await processRes.json().catch(() => ({}));
        setFileState({ fileName: file.name, status: "error", documentId, error: data.error ?? "AI extraction failed." });
        return;
      }
      const result = await processRes.json();
      setFileState({
        fileName: file.name,
        status: "done",
        documentId,
        extractedData: result.extractedData,
        confidence: result.confidence,
      });
    } catch {
      setFileState({ fileName: file.name, status: "error", error: "Network error." });
    }
  }

  // ─── Minimized: floating action button + upgrade bubble ────
  if (isMinimized) {
    return (
      <>
        {/* FAB Upgrade Bubble */}
        {isFreePlan && bubbleVisible && !bubbleDismissed && (
          <div
            className="fixed bottom-8 right-[5.5rem] z-50 flex max-w-[180px] items-start gap-2 rounded-xl bg-[var(--glass-dark)] px-3 py-2.5 shadow-lg ring-1 ring-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-right-2 duration-500"
          >
            <div className="min-w-0 flex-1">
              <p
                key={msgIndex}
                className="text-[11px] leading-snug text-white/70 animate-in fade-in duration-300"
              >
                {UPGRADE_MESSAGES[msgIndex]}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setUpgradeOpen(true); }}
                className="mt-1 text-[10px] font-semibold text-accent-yellow hover:text-accent-yellow/80 transition-colors"
              >
                Upgrade →
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismissUpgradeNudge(); }}
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--glass-dark)] shadow-lg ring-1 ring-white/10 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Open AI Assistant"
        >
          <AiAvatar size="sm" showRing showGlow />
        </button>

        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="general" />
      </>
    );
  }

  // ─── Open: floating panel (not full-screen) ─────────────────
  return (
  <>
    <div className="fixed bottom-6 right-6 z-50 flex h-[520px] max-h-[85vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--glass-dark)] shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <AiAvatar size="sm" showRing showGlow />
          <h3 className="text-[15px] font-semibold text-white">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          {(response || error || fileState) && (
            <button
              onClick={() => {
                setResponse(null);
                setError(null);
                if (fileState?.status === "done" || fileState?.status === "error") {
                  setFileState(null);
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              aria-label="Clear"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label="Minimize"
          >
            <Minimize2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Pro upsell banner */}
      {isFreePlan && !bannerDismissed && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-accent-yellow/15 bg-accent-yellow/5 px-4 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Crown className="h-3 w-3 shrink-0 text-accent-yellow" />
            <span className="truncate text-[11px] text-white/70">
              <b className="text-white/90">Pro:</b> 150 AI tokens/month + unlimited scans
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setUpgradeOpen(true)}
              className="text-[10px] font-semibold text-accent-yellow hover:text-accent-yellow/80 transition-colors whitespace-nowrap"
            >
              Upgrade
            </button>
            <button
              onClick={() => { dismissUpgradeNudge(); }}
              className="flex h-4 w-4 items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Content (scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
        {/* Drop zone */}
        <ExpandedDropZone onFilesSelected={handleExpandedFiles} />

        {/* Upload progress / result */}
        {fileState && (
          <UploadProgress
            fileState={fileState}
            onDismiss={() => setFileState(null)}
            onRetry={fileState.documentId ? async () => {
              const docId = fileState.documentId!;
              setFileState({ ...fileState, status: "extracting", error: undefined });
              try {
                const res = await fetch(`/api/documents/${docId}/process`, { method: "POST" });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  setFileState({ ...fileState, status: "error", error: data.error ?? "Retry failed." });
                  return;
                }
                const result = await res.json();
                setFileState({
                  fileName: fileState.fileName,
                  status: "done",
                  documentId: docId,
                  extractedData: result.extractedData,
                  confidence: result.confidence,
                });
              } catch {
                setFileState({ ...fileState, status: "error", error: "Network error on retry." });
              }
            } : undefined}
          />
        )}

        {/* Error */}
        {error && !thinking && (
          <div className="mt-3 rounded-xl bg-amber-500/20 px-3.5 py-3 text-[13px] text-amber-200">
            {error}
          </div>
        )}

        {/* Thinking */}
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

        {/* Chat response */}
        {response && !thinking && (
          <div className="mt-3 rounded-xl bg-white/5 px-3.5 py-3 text-[13px] leading-relaxed text-white/80">
            {response.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1" : ""}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        {!response && !thinking && !error && !fileState && (
          <div className="mt-3 flex flex-wrap gap-2">
            {getChipsForPath(pathname).map((chip) => (
              <SuggestionChip key={chip.text} text={chip.text} onClick={() => handleQuery(chip.query)} />
            ))}
          </div>
        )}
      </div>

      {/* Input bar (bottom) */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        <AIInputBar onSubmit={handleQuery} onFileStateChange={setFileState} />
      </div>
    </div>

    <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="general" />
  </>
  );
}
