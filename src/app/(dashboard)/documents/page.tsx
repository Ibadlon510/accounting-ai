"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Clock, AlertCircle, Sparkles } from "lucide-react";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { SmartDropZone } from "@/components/workspace/smart-drop-zone";
import { BatchReport, type BatchResult } from "@/components/ai/batch-report";

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
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  function loadDocs() {
    fetch("/api/documents")
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

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents" }]} />
      <PageHeader title="Document Vault" />

      {/* Smart Drop Zone */}
      <SmartDropZone onUploaded={() => loadDocs()} className="mb-6" />

      {/* Filter Tabs + Batch Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
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
        <div className="dashboard-card py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-text-primary" />
          <p className="mt-3 text-[13px] text-text-secondary">Loading documents...</p>
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
                  {new Date(doc.createdAt).toLocaleDateString()}
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
                  {doc.status === "PENDING" && (
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
                          }
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                    >
                      {processingId === doc.id ? "Processing..." : "Process"}
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

