"use client";

import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface BoundingBox {
  field: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  confidence?: number;
}

interface PdfViewerProps {
  url: string;
  boundingBoxes?: BoundingBox[];
  onFieldClick?: (field: string) => void;
  className?: string;
}

export function PdfViewer({ url, boundingBoxes = [], onFieldClick, className }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, rotation, activeField } = useWorkspaceStore();

  const scale = zoom / 100;

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    if (containerRef.current) {
      setPageWidth(containerRef.current.clientWidth - 32);
    }
  }, []);

  function getBoxColor(confidence?: number): string {
    if (!confidence) return "rgba(59, 130, 246, 0.3)";
    if (confidence >= 0.9) return "rgba(34, 197, 94, 0.3)";
    if (confidence >= 0.7) return "rgba(251, 191, 36, 0.3)";
    return "rgba(239, 68, 68, 0.3)";
  }

  function getBoxBorder(confidence?: number): string {
    if (!confidence) return "rgba(59, 130, 246, 0.6)";
    if (confidence >= 0.9) return "rgba(34, 197, 94, 0.7)";
    if (confidence >= 0.7) return "rgba(251, 191, 36, 0.7)";
    return "rgba(239, 68, 68, 0.7)";
  }

  return (
    <div ref={containerRef} className={cn("overflow-auto", className)}>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-text-primary" />
          </div>
        }
        error={
          <div className="flex items-center justify-center py-12 text-[13px] text-text-secondary">
            Failed to load PDF. Try refreshing.
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={i}
            className="relative mx-auto mb-4"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.3s ease",
            }}
          >
            <Page
              pageNumber={i + 1}
              width={pageWidth > 0 ? pageWidth * scale : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />

            {/* Bounding box overlays */}
            {boundingBoxes
              .filter((b) => b.page === i + 1)
              .map((box) => (
                <button
                  key={box.field}
                  type="button"
                  onClick={() => onFieldClick?.(box.field)}
                  className={cn(
                    "absolute transition-all hover:opacity-100",
                    activeField === box.field ? "opacity-100 ring-2 ring-[var(--accent-ai)]" : "opacity-70",
                  )}
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                    background: getBoxColor(box.confidence),
                    border: `2px solid ${getBoxBorder(box.confidence)}`,
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  title={`${box.field} (${box.confidence ? Math.round(box.confidence * 100) + "%" : "no confidence"})`}
                />
              ))}
          </div>
        ))}
      </Document>
    </div>
  );
}
