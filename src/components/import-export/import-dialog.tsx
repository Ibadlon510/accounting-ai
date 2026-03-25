"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import type { PreviewResult, ImportResult } from "@/lib/import-export/types";
import { ImportPreviewTable } from "./import-preview-table";

type Step = "upload" | "previewing" | "preview" | "importing" | "done";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  entityLabel: string;
  onImportComplete?: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  entity,
  entityLabel,
  onImportComplete,
}: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        reset();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, reset]
  );

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setError(null);
      setStep("previewing");

      const fd = new FormData();
      fd.append("file", selectedFile);

      try {
        const res = await fetch(`/api/data/${entity}/preview`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Preview failed");
          setStep("upload");
          return;
        }
        const data: PreviewResult = await res.json();
        setPreview(data);
        setStep("preview");
      } catch {
        setError("Failed to connect to server");
        setStep("upload");
      }
    },
    [entity]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        handleFileSelect(droppedFile);
      } else {
        setError("Please drop a .csv file");
      }
    },
    [handleFileSelect]
  );

  const handleImport = useCallback(async () => {
    if (!file) return;
    setStep("importing");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`/api/data/${entity}/import`, {
        method: "POST",
        body: fd,
      });
      const data: ImportResult = await res.json();
      setImportResult(data);
      setStep("done");

      if (data.imported > 0 || data.updated > 0) {
        showSuccess(
          "Import complete",
          `${data.imported} created, ${data.updated} updated`
        );
        onImportComplete?.();
      } else if (data.failed > 0) {
        showError("Import had errors", `${data.failed} rows failed`);
      }
    } catch {
      setError("Import failed");
      setStep("preview");
    }
  }, [file, entity, onImportComplete]);

  const actionableCount = preview
    ? preview.summary.creates + preview.summary.updates
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import {entityLabel}</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import data."}
            {step === "previewing" && "Validating your file..."}
            {step === "preview" && "Review the data below before importing."}
            {step === "importing" && "Importing data..."}
            {step === "done" && "Import complete."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle p-10 text-center transition-colors hover:border-text-primary/30 hover:bg-surface-secondary/50"
              >
                <Upload className="h-8 w-8 text-text-meta" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Drag and drop your CSV file here
                  </p>
                  <p className="mt-1 text-xs text-text-meta">
                    or click to browse
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = "";
                }}
              />
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <p className="text-xs text-text-meta">
                Need the correct format?{" "}
                <a
                  href={`/api/data/${entity}/template`}
                  download
                  className="font-medium text-text-primary underline underline-offset-2 hover:text-text-primary/80"
                >
                  Download template
                </a>
              </p>
            </div>
          )}

          {step === "previewing" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-text-meta" />
              <p className="text-sm text-text-meta">
                Validating {file?.name}...
              </p>
            </div>
          )}

          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <SummaryBadge
                  color="green"
                  label="Create"
                  count={preview.summary.creates}
                />
                <SummaryBadge
                  color="blue"
                  label="Update"
                  count={preview.summary.updates}
                />
                <SummaryBadge
                  color="red"
                  label="Errors"
                  count={preview.summary.errors}
                />
                <SummaryBadge
                  color="yellow"
                  label="Skipped"
                  count={preview.summary.skipped}
                />
              </div>
              <ImportPreviewTable rows={preview.rows} headers={preview.headers} />
              {file && (
                <p className="text-xs text-text-meta">
                  File: {file.name} ({preview.summary.total} rows)
                </p>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-text-meta" />
              <p className="text-sm text-text-meta">
                Importing {actionableCount} records...
              </p>
            </div>
          )}

          {step === "done" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 dark:bg-green-950/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Import complete
                  </p>
                  <p className="text-green-700 dark:text-green-400">
                    {importResult.imported} created, {importResult.updated}{" "}
                    updated, {importResult.skipped} skipped,{" "}
                    {importResult.failed} failed
                  </p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-text-secondary">
                    Errors:
                  </p>
                  <div className="max-h-32 overflow-auto rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                    {importResult.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-red-700 dark:text-red-400"
                      >
                        Row {err.row >= 0 ? err.row + 1 : "?"}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="rounded-xl"
              >
                Change File
              </Button>
              <Button
                size="sm"
                disabled={actionableCount === 0}
                onClick={handleImport}
                className="gap-1.5 rounded-xl bg-text-primary text-white hover:bg-text-primary/90"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Import {actionableCount} records
              </Button>
            </>
          )}
          {step === "done" && (
            <Button
              size="sm"
              onClick={() => handleClose(false)}
              className="rounded-xl bg-text-primary text-white hover:bg-text-primary/90"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryBadge({
  color,
  label,
  count,
}: {
  color: "green" | "blue" | "red" | "yellow";
  label: string;
  count: number;
}) {
  const colorMap = {
    green:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    yellow:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${colorMap[color]}`}
    >
      {label}: {count}
    </span>
  );
}
