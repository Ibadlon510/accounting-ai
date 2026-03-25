"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { Download, X, Loader2, AlertCircle } from "lucide-react";
import {
  EntityPanel,
  EntityPanelContent,
} from "@/components/overlays/entity-panel";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  templateId?: string;
  data?: Record<string, unknown>;
  filename?: string;
  title?: string;
}

export function PdfPreviewModal({
  open,
  onOpenChange,
  documentType,
  templateId,
  data,
  filename,
  title,
}: PdfPreviewModalProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const { generatePdf, previewPdfBlob, isGenerating, isLoadingPreview } = usePdfExport();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ReactPdf, setReactPdf] = useState<{ Document: any; Page: any } | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  const stableDataKey = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("react-pdf");
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        if (!cancelled) setReactPdf({ Document: mod.Document, Page: mod.Page });
      } catch {
        if (!cancelled) setError("Failed to load PDF viewer");
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const loadPdf = useCallback(async () => {
    setError(null);
    try {
      const blob = await previewPdfBlob({ documentType, templateId, data: dataRef.current });
      const arrayBuffer = await blob.arrayBuffer();
      setPdfData(new Uint8Array(arrayBuffer));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load PDF preview";
      setError(msg);
      setPdfData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, templateId, stableDataKey, previewPdfBlob]);

  useEffect(() => {
    if (open) {
      loadPdf();
    } else {
      setPdfData(null);
      setNumPages(0);
      setError(null);
    }
  }, [open, loadPdf]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w - 48);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDownload = async () => {
    try {
      await generatePdf({ documentType, templateId, data: dataRef.current, filename });
    } catch {
      // toast handled inside hook
    }
  };

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  const fileObj = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData]);

  const DocComponent = ReactPdf?.Document;
  const PageComponent = ReactPdf?.Page;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl" className="flex h-[90vh] flex-col" panelTitle={title ?? "PDF Preview"}>
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {title ?? "PDF Preview"}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isGenerating}
              className="gap-1.5 rounded-xl bg-text-primary px-5 text-white hover:bg-text-primary/90"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {isGenerating ? "Generating…" : "Download PDF"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-[#525659] p-6">
          {(isLoadingPreview || !ReactPdf) && !error ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                <span className="text-[13px] text-white/60">Generating preview…</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="max-w-[400px] text-[13px] text-white/80">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadPdf}
                  className="mt-2 rounded-xl border-white/20 text-white hover:bg-white/10"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : fileObj && DocComponent && PageComponent ? (
            <div className="mx-auto flex flex-col items-center gap-6">
              <DocComponent
                file={fileObj}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                  </div>
                }
                error={
                  <div className="py-20 text-center text-[13px] text-white/60">
                    Failed to render PDF
                  </div>
                }
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <div key={i} className="mb-6 shadow-2xl">
                    <PageComponent
                      pageNumber={i + 1}
                      width={Math.min(containerWidth, 800)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </DocComponent>
              {numPages > 0 && (
                <div className="pb-2 text-[12px] text-white/50">
                  {numPages} page{numPages > 1 ? "s" : ""}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </EntityPanelContent>
    </EntityPanel>
  );
}
