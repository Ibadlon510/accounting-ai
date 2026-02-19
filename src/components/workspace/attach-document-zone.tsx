"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Paperclip, FileText, X, Loader2, Sparkles } from "lucide-react";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface AttachDocumentZoneProps {
  onExtracted?: (data: Record<string, unknown>) => void;
  className?: string;
}

export function AttachDocumentZone({ onExtracted, className }: AttachDocumentZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extracted, setExtracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      showError("Invalid file", "Only PDF, JPEG, PNG, WebP allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showError("File too large", "Maximum size is 10 MB.");
      return;
    }

    setFile(f);
    setUploading(true);
    setExtracted(false);

    const formData = new FormData();
    formData.set("file", f);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setDocumentId(data.documentId);
        showSuccess("Attached", `${f.name} uploaded successfully.`);
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Upload failed", data.error ?? "Please try again.");
        setFile(null);
      }
    } catch {
      showError("Upload failed", "Network error.");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleScanWithAI() {
    if (!documentId) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/process`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.extractedData) {
          setExtracted(true);
          onExtracted?.(data.extractedData);
          showSuccess("AI Extraction Complete", "Form fields have been auto-filled from the document.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showError("Processing failed", err.error ?? "Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    setFile(null);
    setDocumentId(null);
    setExtracted(false);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-3 text-[13px] text-text-secondary transition-all hover:border-[var(--accent-ai)]/40 hover:bg-[var(--accent-ai)]/[0.02] hover:text-text-primary"
        >
          <Paperclip className="h-4 w-4" />
          Attach source document
        </button>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface/50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-text-meta" />
            <span className="flex-1 truncate text-[13px] font-medium text-text-primary">
              {file.name}
            </span>
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-ai)]" />}
            {!uploading && !extracted && (
              <span className="text-[11px] font-medium text-success">Attached</span>
            )}
            {extracted && (
              <span className="text-[11px] font-medium text-[var(--accent-ai)]">Extracted</span>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-5 w-5 items-center justify-center rounded text-text-meta hover:text-text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {documentId && !extracted && !uploading && (
            <button
              type="button"
              onClick={handleScanWithAI}
              disabled={processing}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-ai)]/10 px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-ai)] transition-all hover:bg-[var(--accent-ai)]/20"
            >
              <Sparkles className="h-3 w-3" />
              {processing ? "Scanning..." : "Scan with AI to auto-fill"}
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
