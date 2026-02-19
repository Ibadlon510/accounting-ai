"use client";

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { CloudUpload, FileText, X, Loader2, Camera } from "lucide-react";
import { showError } from "@/lib/utils/toast-helpers";

const LazyCameraCapture = lazy(() =>
  import("@/components/mobile/camera-capture").then((m) => ({ default: m.CameraCapture }))
);

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

type UploadingFile = {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  documentId?: string;
};

interface SmartDropZoneProps {
  onUploaded?: (documentId: string) => void;
  className?: string;
}

export function SmartDropZone({ onUploaded, className }: SmartDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const valid: File[] = [];

      for (const file of incoming) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          showError("Invalid file", `${file.name}: Only PDF, JPEG, PNG, WebP allowed.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          showError("File too large", `${file.name}: Maximum size is 10 MB.`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length === 0) return;

      const newEntries: UploadingFile[] = valid.map((f) => ({
        file: f,
        progress: 0,
        status: "uploading" as const,
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const formData = new FormData();
        formData.set("file", file);

        try {
          const res = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, status: "done", progress: 100, documentId: data.documentId }
                  : f
              )
            );
            onUploaded?.(data.documentId);
          } else {
            const data = await res.json().catch(() => ({}));
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, status: "error", error: data.error ?? "Upload failed" }
                  : f
              )
            );
          }
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, status: "error", error: "Network error" }
                : f
            )
          );
        }
      }
    },
    [onUploaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasFiles = files.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed transition-all",
          isDragging
            ? "border-[var(--accent-ai)] bg-[var(--accent-ai)]/5 scale-[1.01]"
            : "border-border-subtle hover:border-[var(--accent-ai)]/40 hover:bg-[var(--accent-ai)]/[0.02]",
          hasFiles ? "px-5 py-4" : "px-8 py-8"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {!hasFiles && (
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
              isDragging
                ? "bg-[var(--accent-ai)]/10 text-[var(--accent-ai)]"
                : "bg-text-primary/5 text-text-meta"
            )}>
              <CloudUpload className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium text-text-primary">
              {isDragging ? "Drop files here" : "Drop invoices, receipts, or credit notes here"}
            </p>
            <p className="mt-1 text-[12px] text-text-meta">
              PDF, JPEG, PNG, WebP — up to 10 MB each
            </p>
            {isMobile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCamera(true);
                }}
                className="mt-3 flex items-center gap-2 rounded-xl bg-text-primary/5 px-4 py-2 text-[13px] font-medium text-text-primary hover:bg-text-primary/10"
              >
                <Camera className="h-4 w-4" />
                Scan with Camera
              </button>
            )}
          </div>
        )}

        {/* Uploading file list */}
        {hasFiles && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className="flex items-center gap-3 rounded-xl bg-surface/80 px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-text-meta" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-primary">
                    {f.file.name}
                  </p>
                  {f.status === "uploading" && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border-subtle">
                      <div className="h-full animate-pulse rounded-full bg-[var(--accent-ai)]" style={{ width: "60%" }} />
                    </div>
                  )}
                  {f.status === "error" && (
                    <p className="mt-0.5 text-[11px] text-error">{f.error}</p>
                  )}
                </div>
                {f.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-ai)]" />
                )}
                {f.status === "done" && (
                  <span className="text-[11px] font-medium text-success">Uploaded</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-text-meta hover:bg-black/5 hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <p className="text-center text-[11px] text-text-meta">
              Click or drop more files to upload
            </p>
          </div>
        )}
      </div>
      {/* Mobile camera capture */}
      {showCamera && (
        <CameraCaptureModal
          onCaptured={(file) => {
            setShowCamera(false);
            handleFiles([file]);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

function CameraCaptureModal({ onCaptured, onClose }: { onCaptured: (file: File) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-text-primary">Scan Document</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[var(--accent-ai)]" /></div>}>
          <LazyCameraCapture onCaptured={onCaptured} />
        </Suspense>
      </div>
    </div>
  );
}
