"use client";

import { useState, useRef } from "react";
import { HelpCircle, LayoutGrid, SendHorizonal, Paperclip } from "lucide-react";
import { AiAvatar } from "./ai-avatar";
import { comingSoon } from "@/lib/utils/toast-helpers";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export type FileUploadState = {
  fileName: string;
  status: "uploading" | "extracting" | "done" | "error";
  documentId?: string;
  extractedData?: Record<string, unknown>;
  confidence?: number;
  error?: string;
};

interface AIInputBarProps {
  onSubmit?: (query: string) => void;
  onFileStateChange?: (state: FileUploadState | null) => void;
}

export function AIInputBar({ onSubmit, onFileStateChange }: AIInputBarProps) {
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  }

  async function handleFileSelected(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onFileStateChange?.({ fileName: file.name, status: "error", error: "Only PDF, JPEG, PNG, WebP allowed." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onFileStateChange?.({ fileName: file.name, status: "error", error: "File too large (max 10 MB)." });
      return;
    }

    // Step 1: Upload
    onFileStateChange?.({ fileName: file.name, status: "uploading" });
    const formData = new FormData();
    formData.set("file", file);

    try {
      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        onFileStateChange?.({ fileName: file.name, status: "error", error: data.error ?? "Upload failed." });
        return;
      }
      const { documentId } = await uploadRes.json();

      // Step 2: AI Extraction
      onFileStateChange?.({ fileName: file.name, status: "extracting", documentId });
      const processRes = await fetch(`/api/documents/${documentId}/process`, { method: "POST" });
      if (!processRes.ok) {
        const data = await processRes.json().catch(() => ({}));
        onFileStateChange?.({ fileName: file.name, status: "error", documentId, error: data.error ?? "AI extraction failed." });
        return;
      }
      const result = await processRes.json();
      onFileStateChange?.({
        fileName: file.name,
        status: "done",
        documentId,
        extractedData: result.extractedData,
        confidence: result.confidence,
      });
    } catch {
      onFileStateChange?.({ fileName: file.name, status: "error", error: "Network error." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <AiAvatar size="sm" showGlow />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything or drop a receipt..."
        className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/40 outline-none"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-1">
        {value.trim() && (
          <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white">
            <SendHorizonal className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70"
          title="Upload document"
        >
          <Paperclip className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button type="button" onClick={() => comingSoon("AI Help")} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70">
          <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button type="button" onClick={() => comingSoon("AI Commands")} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70">
          <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </form>
  );
}
