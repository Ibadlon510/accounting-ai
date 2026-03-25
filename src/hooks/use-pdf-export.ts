"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface PdfExportOptions {
  documentType: string;
  templateId?: string;
  data?: Record<string, unknown>;
  customSlots?: { headerHtml?: string; footerHtml?: string; customCss?: string; watermark?: string };
  pageSize?: "A4" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  filename?: string;
}

export function usePdfExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const previewPdf = useCallback(async (options: PdfExportOptions): Promise<string> => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch("/api/pdf/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Preview failed" }));
        throw new Error(err.error ?? "Preview failed");
      }
      return await res.text();
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const previewPdfBlob = useCallback(async (options: PdfExportOptions): Promise<Blob> => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Preview failed" }));
        throw new Error(err.error ?? "PDF generation failed");
      }
      return await res.blob();
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const generatePdf = useCallback(async (options: PdfExportOptions): Promise<void> => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error ?? "PDF generation failed");
      }
      const blob = await res.blob();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const a = document.createElement("a");
      a.href = url;
      a.download = options.filename ?? `${options.documentType}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PDF export failed";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePdf, previewPdf, previewPdfBlob, isGenerating, isLoadingPreview };
}
