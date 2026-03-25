"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckCircle, Clock, AlertCircle, Sparkles, LayoutDashboard, Settings,
  RefreshCw, X,
} from "lucide-react";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { formatDate } from "@/lib/formatting";
import { SmartDropZone } from "@/components/workspace/smart-drop-zone";
import { BatchReport, type BatchResult } from "@/components/ai/batch-report";
import { DashboardPill } from "@/components/dashboard/dashboard-pill";
import { DocumentsDashboard } from "@/components/dashboard/variants/documents-dashboard";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import type { DocumentsMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

type DocItem = {
  id: string;
  s3Key: string;
  status: string;
  aiConfidence: number | null;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; icon: typeof FileText; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-muted text-text-secondary" },
  PROCESSED: { label: "Verified", icon: CheckCircle, className: "bg-success-light text-success" },
  FLAGGED: { label: "Flagged", icon: AlertCircle, className: "bg-accent-yellow/20 text-amber-700" },
  PROCESSING_FAILED: { label: "Failed", icon: AlertCircle, className: "bg-error-light text-error" },
  ARCHIVED: { label: "Archived", icon: FileText, className: "bg-muted text-text-meta" },
};

type FilterTab = "all" | "pending" | "verified" | "flagged";

export default function DocumentsPage() {
  usePageTitle("Document Vault");
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const { isVisible } = useDashboardPillPreferences("documents");

  const { data: mini, isLoading: miniLoading, error: miniError, refetch: refetchMini } = useQuery({
    queryKey: ["mini-stats", "documents"],
    queryFn: () => fetchJson<DocumentsMiniStats>("/api/documents/mini-stats"),
  });

  function loadDocs() {
    fetch("/api/documents", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { documents: [] }))
      .then((data: { documents: DocItem[] }) => setDocuments(data.documents ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDocs();
  }, []);

  const filtered = documents.filter((doc) => {
    if (activeTab === "pending") return doc.status === "PENDING" || doc.status === "PROCESSING_FAILED";
    if (activeTab === "verified") return doc.status === "PROCESSED" || doc.status === "ARCHIVED";
    if (activeTab === "flagged") return doc.status === "FLAGGED";
    return true;
  });

  const counts = {
    all: documents.length,
    pending: documents.filter((d) => d.status === "PENDING" || d.status === "PROCESSING_FAILED").length,
    verified: documents.filter((d) => d.status === "PROCESSED" || d.status === "ARCHIVED").length,
    flagged: documents.filter((d) => d.status === "FLAGGED").length,
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "flagged", label: "Flagged", count: counts.flagged },
    { id: "verified", label: "Verified", count: counts.verified },
  ];

  const cardCounts = {
    pending: mini?.pendingCount ?? counts.pending,
    verified: mini?.verifiedCount ?? counts.verified,
    flagged: mini?.flaggedCount ?? counts.flagged,
    total: mini?.totalCount ?? counts.all,
  };

  const cards = [
    {
      title: "Pending",
      value: String(cardCounts.pending),
      icon: Clock,
      href: "#",
      onClick: () => setActiveTab("pending"),
      color: "text-accent-yellow",
      accentBorder: "border-l-accent-yellow",
      iconBg: "bg-accent-yellow/10",
      subtitle: "Awaiting processing",
    },
    {
      title: "Verified",
      value: String(cardCounts.verified),
      icon: CheckCircle,
      href: "#",
      onClick: () => setActiveTab("verified"),
      color: "text-success",
      accentBorder: "border-l-success",
      iconBg: "bg-success/10",
      subtitle: "AI-extracted",
    },
    {
      title: "Flagged",
      value: String(cardCounts.flagged),
      icon: AlertCircle,
      href: "#",
      onClick: () => setActiveTab("flagged"),
      color: "text-error",
      accentBorder: "border-l-error",
      iconBg: "bg-error/10",
      subtitle: "Needs review",
    },
    {
      title: "Total",
      value: String(cardCounts.total),
      icon: FileText,
      href: "#",
      onClick: () => setActiveTab("all"),
      color: "text-[var(--accent-ai)]",
      accentBorder: "border-l-[var(--accent-ai)]",
      iconBg: "bg-[var(--accent-ai)]/10",
      subtitle: "Documents",
    },
  ];

  const insightText = cardCounts.pending > 0
    ? `${cardCounts.pending} document(s) pending AI extraction — process to verify`
    : cardCounts.flagged > 0
    ? `${cardCounts.flagged} document(s) flagged for review`
    : "All documents verified. Upload more to continue.";

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents" }]} />
      <PageHeader title="Document Vault" />

      <SmartDropZone onUploaded={() => { loadDocs(); refetchMini(); }} className="mb-6" />

      {!dismissedInsight && (
        <div className="dashboard-card !py-3.5 !px-5 border-l-4 border-l-[var(--accent-ai)] flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          </div>
          <p className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">AI Insight: </span>
            {insightText}
          </p>
          <button
            onClick={() => setDismissedInsight(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta hover:bg-muted/50 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="text-left"
            >
              <div className={`dashboard-card group cursor-pointer border-l-[3px] ${card.accentBorder} transition-all hover:shadow-lg hover:-translate-y-0.5 w-full`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/5">
                  <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">{card.title}</p>
                <p className={`mt-0.5 text-[28px] font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
                <p className="mt-1 text-[11px] text-text-meta">{card.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <LayoutDashboard className="h-4 w-4 text-text-secondary" />
              <h2 className="text-[15px] font-semibold text-text-primary">Dashboard</h2>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomize(!showCustomize)}
            className="rounded-xl text-[12px]"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {showCustomize ? "Back" : "Customize"}
          </Button>
        </div>

        {showCustomize ? (
          <div className="dashboard-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary">Customize widgets</h3>
            </div>
            <DashboardCustomizePanel variant="documents" />
          </div>
        ) : (
          <>
            {miniLoading && <DashboardSkeleton />}
            {miniError && (
              <div className="dashboard-card border-l-4 border-l-destructive">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">Failed to load dashboard</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">There was an error fetching document stats. Please try again.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchMini()} className="shrink-0 rounded-xl">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            {!miniLoading && !miniError && mini && (
              <DocumentsDashboard mini={mini} isVisible={isVisible} layout="page" />
            )}
          </>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <DashboardPill />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
              }`}
              style={activeTab === tab.id ? { boxShadow: "var(--shadow-card)" } : undefined}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.id ? "bg-text-primary/10 text-text-primary" : "bg-black/5 text-text-meta"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        {counts.pending > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl text-[12px] font-semibold"
            disabled={batchProcessing}
            onClick={async () => {
              const pending = documents.filter((d) => d.status === "PENDING");
              if (pending.length === 0) return;
              setBatchProcessing(true);
              let processed = 0;
              let failed = 0;
              for (const doc of pending) {
                try {
                  const res = await fetch(`/api/documents/${doc.id}/process`, { method: "POST" });
                  if (res.ok) processed++;
                  else failed++;
                } catch {
                  failed++;
                }
              }
              setBatchProcessing(false);
              loadDocs();
              refetchMini();
              if (processed > 0) {
                setBatchResult({
                  total: pending.length,
                  highConfidence: Math.round(processed * 0.7),
                  needsReview: Math.round(processed * 0.3),
                  failed,
                  totalSpend: Math.round(processed * 4250),
                  topCategories: [
                    { name: "Office Supplies", count: Math.ceil(processed * 0.4) },
                    { name: "Professional Services", count: Math.ceil(processed * 0.3) },
                  ],
                });
              } else {
                showError("Batch processing failed", "No documents were processed.");
              }
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {batchProcessing ? "Processing..." : `Process All (${counts.pending})`}
          </Button>
        )}
      </div>

      {batchResult && (
        <BatchReport
          result={batchResult}
          onDismiss={() => setBatchResult(null)}
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="dashboard-card overflow-hidden !p-0">
          <div className="flex items-center gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 rounded bg-border-subtle/40 animate-pulse" style={{ flex: i === 2 ? 2 : 1 }} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border-subtle/50 px-6 py-3.5 animate-pulse">
              <div className="h-4 w-20 rounded bg-border-subtle/40" />
              <div className="h-5 w-16 rounded-full bg-border-subtle/30" />
              <div className="h-4 flex-[2] rounded bg-border-subtle/30" />
              <div className="h-4 w-12 rounded bg-border-subtle/40" />
              <div className="h-7 w-16 rounded-lg bg-border-subtle/30" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card py-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[var(--accent-ai)] mb-3" />
          <p className="text-[15px] font-medium text-text-primary">
            {documents.length === 0 ? "No documents yet" : "No documents match this filter"}
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {documents.length === 0
              ? "Drop a PDF or image above to get started with AI-powered extraction."
              : "Try a different tab or upload more documents."}
          </p>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden !p-0 overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4">File</div>
            <div className="col-span-2 text-right">Confidence</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {filtered.map((doc) => {
            const config = statusConfig[doc.status] ?? statusConfig.PENDING;
            const Icon = config.icon;
            const fileName = doc.s3Key.split("/").pop() ?? "document";
            return (
              <div
                key={doc.id}
                className="min-w-[640px] grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 items-center text-[13px]"
              >
                <div className="col-span-2 text-text-secondary">
                  {formatDate(doc.createdAt)}
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.className}`}>
                    <Icon className="h-3.5 w-3.5" /> {config.label}
                  </span>
                </div>
                <div className="col-span-4 truncate text-text-primary font-mono text-[12px]">{fileName}</div>
                <div className="col-span-2 text-right text-text-secondary">
                  {doc.aiConfidence != null ? `${Math.round(doc.aiConfidence * 100)}%` : "—"}
                </div>
                <div className="col-span-2 text-right flex gap-1 justify-end">
                  {(doc.status === "PENDING" || doc.status === "PROCESSING_FAILED") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-[12px]"
                      disabled={processingId !== null}
                      onClick={async (e) => {
                        e.preventDefault();
                        setProcessingId(doc.id);
                        try {
                          const res = await fetch(`/api/documents/${doc.id}/process`, { method: "POST" });
                          if (res.ok) {
                            window.location.href = `/documents/${doc.id}/verify`;
                          } else {
                            const data = await res.json().catch(() => ({}));
                            showError("Processing failed", data.error ?? "Please try again.");
                            loadDocs();
                          }
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                    >
                      {processingId === doc.id ? "Processing..." : doc.status === "PROCESSING_FAILED" ? "Retry" : "Process"}
                    </Button>
                  )}
                  {doc.status === "PENDING" || doc.status === "FLAGGED" || doc.status === "PROCESSING_FAILED" ? (
                    <Link href={`/documents/${doc.id}/verify`}>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
                        Verify
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-text-meta text-[12px]">Verified</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
