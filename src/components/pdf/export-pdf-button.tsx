"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { Download, Loader2 } from "lucide-react";

const PdfPreviewModal = dynamic(
  () => import("./pdf-preview-modal").then((m) => ({ default: m.PdfPreviewModal })),
  { ssr: false }
);

interface ExportPdfButtonProps {
  documentType: string;
  documentId?: string;
  params?: Record<string, string>;
  data?: Record<string, unknown>;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "xs";
  className?: string;
  label?: string;
  filename?: string;
  skipPreview?: boolean;
}

export function ExportPdfButton({
  documentType,
  documentId,
  params,
  data,
  variant = "outline",
  size = "sm",
  className,
  label = "Export PDF",
  filename,
  skipPreview = false,
}: ExportPdfButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { generatePdf, isGenerating } = usePdfExport();

  const exportData: Record<string, unknown> = {
    ...(data ?? {}),
    ...(params ? { params } : {}),
    ...(documentId ? { documentId } : {}),
  };

  const buttonClass = className ?? "h-9 gap-2 rounded-xl border-border-subtle text-[12px]";

  if (skipPreview) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => void generatePdf({ documentType, data: exportData, filename }).catch(() => {})}
        disabled={isGenerating}
        className={buttonClass}
      >
        {isGenerating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {isGenerating ? "Generating…" : label}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowPreview(true)}
        className={buttonClass}
      >
        <Download className="h-3.5 w-3.5" />
        {label}
      </Button>

      <PdfPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        documentType={documentType}
        data={exportData}
        filename={filename}
      />
    </>
  );
}
