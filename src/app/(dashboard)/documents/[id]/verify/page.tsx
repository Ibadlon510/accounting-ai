"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartField } from "@/components/workspace/smart-field";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { Sparkles, ShieldCheck, AlertTriangle, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { ShakeWrapper, FileAwayAnimation } from "@/components/ui/motion-wrappers";
import { GLCombobox } from "@/components/ai/gl-combobox";
import { DuplicateWarning, type DuplicateMatch } from "@/components/ai/duplicate-warning";
import { PdfViewer, type BoundingBox } from "@/components/workspace/pdf-viewer";

type Account = { id: string; code: string; name: string };

type ExtractedData = {
  merchant?: { name?: string };
  invoice?: { date?: string; total_amount?: number; tax_amount?: number; net_amount?: number; currency?: string };
  gl_prediction?: { code?: string; confidence?: number };
  validation?: { math_check_passed?: boolean; issues?: string[] };
};

type DocumentDoc = {
  id: string;
  status: string;
  extractedData: ExtractedData | null;
  aiConfidence: number | null;
};

function buildBoundingBoxes(ex: ExtractedData | null): BoundingBox[] {
  if (!ex) return [];
  const boxes: BoundingBox[] = [];
  const conf = ex.gl_prediction?.confidence ?? 0.8;
  if (ex.merchant?.name) {
    boxes.push({ field: "merchantName", x: 0.05, y: 0.05, width: 0.4, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.date) {
    boxes.push({ field: "date", x: 0.6, y: 0.05, width: 0.3, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.total_amount != null) {
    boxes.push({ field: "totalAmount", x: 0.55, y: 0.7, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.tax_amount != null) {
    boxes.push({ field: "vatAmount", x: 0.55, y: 0.65, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.net_amount != null) {
    boxes.push({ field: "netAmount", x: 0.55, y: 0.6, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  return boxes;
}

export default function DocumentVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [doc, setDoc] = useState<DocumentDoc | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const pendingNavRef = useRef<string | null>(null);
  const { zoom, rotation, zoomIn, zoomOut, rotateRight, setActiveField } = useWorkspaceStore();
  const initialGlRef = useRef<string>("");
  const initialMerchantRef = useRef<string>("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    totalAmount: "",
    vatAmount: "",
    netAmount: "",
    currency: "AED",
    merchantName: "",
    glAccountId: "",
  });

  const overallConfidence = doc?.aiConfidence ?? 0;
  const ex = doc?.extractedData ?? null;
  const mathOk = ex?.validation?.math_check_passed !== false;

  const fieldConfidence = useCallback((fieldName: string): number | undefined => {
    if (!ex) return undefined;
    if (fieldName === "glAccountId") return ex.gl_prediction?.confidence;
    return overallConfidence;
  }, [ex, overallConfidence]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/documents/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/documents/${id}/url`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/org/chart-of-accounts").then((r) => (r.ok ? r.json() : { accounts: [] })),
    ])
      .then(([docData, urlData, accData]) => {
        const accList = (accData.accounts ?? []) as Account[];
        if (docData) {
          setDoc(docData);
          const extracted = docData.extractedData as ExtractedData | null;
          if (extracted?.invoice || extracted?.merchant) {
            const matchGl = extracted.gl_prediction?.code
              ? accList.find((a) => extracted.gl_prediction!.code!.startsWith(a.code) || extracted.gl_prediction!.code!.includes(a.name))
              : null;
            const glId = matchGl?.id ?? "";
            const merchant = extracted.merchant?.name ?? "";
            initialGlRef.current = glId;
            initialMerchantRef.current = merchant;
            setForm((f) => ({
              ...f,
              date: extracted.invoice?.date ?? f.date,
              totalAmount: extracted.invoice?.total_amount != null ? String(extracted.invoice.total_amount) : f.totalAmount,
              vatAmount: extracted.invoice?.tax_amount != null ? String(extracted.invoice.tax_amount) : f.vatAmount,
              netAmount: extracted.invoice?.net_amount != null ? String(extracted.invoice.net_amount) : f.netAmount,
              currency: extracted.invoice?.currency ?? f.currency,
              merchantName: merchant || f.merchantName,
              glAccountId: glId || f.glAccountId,
            }));
          }
        }
        if (urlData?.url) setViewUrl(urlData.url);
        setAccounts(accList);

        const ext = docData?.extractedData as ExtractedData | null;
        const merchant = ext?.merchant?.name?.trim();
        const amount = ext?.invoice?.total_amount;
        const newDate = ext?.invoice?.date ?? "";
        if (merchant && amount != null) {
          const params = new URLSearchParams({
            merchantName: merchant,
            amount: String(amount),
            excludeDocumentId: id,
          });
          if (newDate) params.set("date", newDate);
          fetch(`/api/documents/duplicates?${params}`)
            .then((r) => (r.ok ? r.json() : { duplicates: [] }))
            .then((data) => {
              const list = (data.duplicates ?? []) as Array<{ documentId: string; merchantName: string; amount: number; date: string; similarity: number }>;
              setDuplicates(
                list.map((d, i) => ({
                  id: `dup-${d.documentId}-${i}`,
                  existingDocId: d.documentId,
                  merchant: d.merchantName,
                  amount: d.amount,
                  existingDate: d.date,
                  newDate: newDate || "Unknown",
                  similarity: d.similarity,
                }))
              );
            })
            .catch(() => setDuplicates([]));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.glAccountId || !form.merchantName.trim()) return;

    // Learning toast: detect if user overrode the AI-predicted GL account
    const glChanged = initialGlRef.current && form.glAccountId !== initialGlRef.current;
    const merchantName = form.merchantName.trim();

    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          totalAmount: Number(form.totalAmount) || 0,
          vatAmount: Number(form.vatAmount) || 0,
          netAmount: Number(form.netAmount) || 0,
          currency: form.currency,
          merchantName,
          glAccountId: form.glAccountId,
        }),
      });
      if (res.ok) {
        if (glChanged) {
          const newAcc = accounts.find((a) => a.id === form.glAccountId);
          showSuccess(
            "Preference saved",
            `We'll remember ${newAcc?.name ?? "this category"} for ${merchantName} next time.`
          );
        } else {
          showSuccess("Verified", `Document for ${merchantName} has been filed.`);
        }

        // Queue auto-advance: find next pending document
        let nextRoute = "/documents";
        try {
          const docsRes = await fetch("/api/documents");
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            const pending = (docsData.documents ?? []).filter(
              (d: { id: string; status: string }) => d.id !== id && (d.status === "PENDING" || d.status === "FLAGGED")
            );
            if (pending.length > 0) {
              showSuccess("Next document", `${pending.length} document${pending.length > 1 ? "s" : ""} remaining in queue.`);
              nextRoute = `/documents/${pending[0].id}/verify`;
            }
          }
        } catch { /* fall through to /documents */ }

        // Trigger file-away animation, then navigate
        pendingNavRef.current = nextRoute;
        setShowContent(false);
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Verification failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents", href: "/documents" }, { label: "Verify" }]} />
        <div className="dashboard-card py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-text-primary" />
          <p className="mt-3 text-[13px] text-text-secondary">Loading document...</p>
        </div>
      </>
    );
  }

  // Math check: net + vat ≈ total
  const total = Number(form.totalAmount) || 0;
  const vat = Number(form.vatAmount) || 0;
  const net = Number(form.netAmount) || 0;
  const mathMismatch = total > 0 && net > 0 && Math.abs((net + vat) - total) > 0.5;

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents", href: "/documents" }, { label: "Verify" }]} />

      {/* AI confidence banner */}
      {doc?.aiConfidence != null && (
        <div className={`mb-4 flex items-center gap-3 rounded-2xl px-5 py-3 text-[13px] font-medium ${
          doc.aiConfidence >= 0.9
            ? "bg-[var(--confidence-high)]/10 text-[var(--confidence-high)]"
            : doc.aiConfidence >= 0.7
              ? "bg-[var(--confidence-medium)]/10 text-amber-700"
              : "bg-[var(--confidence-low)]/10 text-[var(--confidence-low)]"
        }`}>
          {doc.aiConfidence >= 0.9 ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          AI confidence: {Math.round(doc.aiConfidence * 100)}%
          {!mathOk && <span className="ml-2 text-[var(--confidence-low)]">• Math check failed</span>}
          {ex?.validation?.issues?.map((issue, i) => (
            <span key={i} className="ml-2 text-[var(--confidence-low)]">• {issue}</span>
          ))}
        </div>
      )}

      {duplicates.length > 0 && (
        <DuplicateWarning duplicates={duplicates} className="mb-4" />
      )}

      <FileAwayAnimation
        show={showContent}
        onComplete={() => {
          if (pendingNavRef.current) {
            router.push(pendingNavRef.current);
            router.refresh();
          }
        }}
      >
      <div style={{ minHeight: "calc(100vh - 200px)" }}>
        <WorkspaceLayout
          defaultLeftSize={50}
          left={
            <div className="dashboard-card flex h-full flex-col !p-0 overflow-hidden !rounded-r-none">
              {/* Viewer toolbar */}
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                <h3 className="text-[13px] font-semibold text-text-primary">Document Preview</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={zoomOut}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5 hover:text-text-primary"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[3rem] text-center text-[11px] font-medium text-text-meta">{zoom}%</span>
                  <button
                    onClick={zoomIn}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5 hover:text-text-primary"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={rotateRight}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5 hover:text-text-primary"
                    title="Rotate"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
                {viewUrl ? (
                  viewUrl.includes(".pdf") || viewUrl.includes("application/pdf") ? (
                    <PdfViewer
                      url={viewUrl}
                      boundingBoxes={buildBoundingBoxes(ex)}
                      onFieldClick={(field) => setActiveField(field)}
                      className="h-full p-4"
                    />
                  ) : (
                    <div className="flex min-h-full items-start justify-center p-4">
                      <img
                        src={viewUrl}
                        alt="Document"
                        className="border border-border-subtle bg-white shadow-sm"
                        style={{
                          maxWidth: `${zoom}%`,
                          borderRadius: 12,
                          transform: `rotate(${rotation}deg)`,
                          transformOrigin: "center center",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-text-secondary text-[14px]">Preview not available.</p>
                  </div>
                )}
              </div>
            </div>
          }
          right={
            <div className="dashboard-card flex h-full flex-col !rounded-l-none">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-text-primary">Verification</h3>
            {ex && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-ai)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--accent-ai)]">
                <Sparkles className="h-3 w-3" /> AI Extracted
              </span>
            )}
          </div>

          {doc?.status === "PENDING" && !doc?.extractedData && (
            <div className="mb-4 rounded-xl border-2 border-dashed border-[var(--accent-ai)]/30 bg-[var(--accent-ai)]/5 p-5 text-center">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-[var(--accent-ai)]" />
              <p className="text-[13px] font-medium text-text-primary">This document hasn&apos;t been processed yet</p>
              <p className="mt-1 text-[12px] text-text-secondary">Let AI extract the details automatically</p>
              <Button
                type="button"
                className="mt-3 gap-2 rounded-xl bg-[var(--accent-ai)] px-5 text-[13px] font-semibold text-white hover:bg-[var(--accent-ai)]/90"
                disabled={processing}
                onClick={async () => {
                  setProcessing(true);
                  try {
                    const res = await fetch(`/api/documents/${id}/process`, { method: "POST" });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.extractedData) {
                        const extracted = data.extractedData as ExtractedData;
                        setForm((f) => ({
                          ...f,
                          date: extracted.invoice?.date ?? f.date,
                          totalAmount: extracted.invoice?.total_amount != null ? String(extracted.invoice.total_amount) : f.totalAmount,
                          vatAmount: extracted.invoice?.tax_amount != null ? String(extracted.invoice.tax_amount) : f.vatAmount,
                          netAmount: extracted.invoice?.net_amount != null ? String(extracted.invoice.net_amount) : f.netAmount,
                          currency: extracted.invoice?.currency ?? f.currency,
                          merchantName: extracted.merchant?.name ?? f.merchantName,
                        }));
                        setDoc((d) => (d ? { ...d, extractedData: extracted, aiConfidence: data.confidence } : d));
                        showSuccess("Extraction complete", "AI has filled in the details. Please review.");
                      }
                    } else {
                      const err = await res.json().catch(() => ({}));
                      showError("Processing failed", err.error ?? "Please try again.");
                    }
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                <Sparkles className="h-4 w-4" />
                {processing ? "Processing..." : "Process with AI"}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 space-y-3">
            <SmartField label="Date" confidence={fieldConfidence("date")}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-9 rounded-lg border-border-subtle text-[13px]"
                required
              />
            </SmartField>

            <SmartField label="Merchant Name" confidence={fieldConfidence("merchantName")}>
              <Input
                value={form.merchantName}
                onChange={(e) => setForm((f) => ({ ...f, merchantName: e.target.value }))}
                placeholder="e.g. Starbucks UAE"
                className="h-9 rounded-lg border-border-subtle text-[13px]"
                required
              />
            </SmartField>

            <div className="grid grid-cols-3 gap-3">
              <SmartField
                label="Total"
                confidence={fieldConfidence("totalAmount")}
                hasError={mathMismatch}
                errorMessage={mathMismatch ? "Net + VAT doesn't match total" : undefined}
              >
                <Input
                  type="number"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                  className="h-9 rounded-lg border-border-subtle text-[13px] font-mono"
                />
              </SmartField>
              <SmartField label="VAT" confidence={fieldConfidence("vatAmount")}>
                <Input
                  type="number"
                  step="0.01"
                  value={form.vatAmount}
                  onChange={(e) => setForm((f) => ({ ...f, vatAmount: e.target.value }))}
                  className="h-9 rounded-lg border-border-subtle text-[13px] font-mono"
                />
              </SmartField>
              <SmartField label="Net" confidence={fieldConfidence("netAmount")}>
                <Input
                  type="number"
                  step="0.01"
                  value={form.netAmount}
                  onChange={(e) => setForm((f) => ({ ...f, netAmount: e.target.value }))}
                  className="h-9 rounded-lg border-border-subtle text-[13px] font-mono"
                />
              </SmartField>
            </div>

            <SmartField
              label="GL Account"
              confidence={fieldConfidence("glAccountId")}
              tooltipText={ex?.gl_prediction ? `AI suggested: ${ex.gl_prediction.code} (${Math.round((ex.gl_prediction.confidence ?? 0) * 100)}% confident)` : undefined}
            >
              <GLCombobox
                accounts={accounts}
                value={form.glAccountId}
                onChange={(id) => setForm((f) => ({ ...f, glAccountId: id }))}
                aiSuggestion={
                  ex?.gl_prediction?.code
                    ? {
                        accountId: accounts.find((a) => ex.gl_prediction!.code!.startsWith(a.code))?.id ?? "",
                        confidence: ex.gl_prediction.confidence ?? 0,
                      }
                    : null
                }
                required
              />
              {accounts.length === 0 && (
                <p className="mt-1 text-[11px] text-text-meta">No accounts. Add a Chart of Accounts first.</p>
              )}
            </SmartField>

            <div className="flex items-center gap-3 pt-4">
              <ShakeWrapper shake={shakeBtn}>
                <Button
                  type="submit"
                  disabled={saving || !form.glAccountId}
                  className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
                  onClick={(e) => {
                    if (mathMismatch) {
                      e.preventDefault();
                      setShakeBtn(true);
                      setTimeout(() => setShakeBtn(false), 600);
                      showError("Math mismatch", "Net + VAT doesn't match Total. Please fix before verifying.");
                    }
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {saving ? "Saving..." : "Verify & File"}
                </Button>
              </ShakeWrapper>
              <Link href="/documents">
                <Button type="button" variant="ghost" className="rounded-xl text-[13px]">Cancel</Button>
              </Link>
            </div>
          </form>
            </div>
          }
        />
      </div>
      </FileAwayAnimation>
    </>
  );
}
