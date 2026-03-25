"use client";

import { useState, useRef } from "react";
import { HelpCircle, LayoutGrid, SendHorizonal, Paperclip } from "lucide-react";
import { AiAvatar } from "./ai-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const AI_HELP_TIPS = [
  "Type a question to get AI-powered accounting insights",
  "Upload a receipt or invoice for automatic data extraction",
  "Try: 'What's my revenue this month?'",
];

const AI_COMMANDS = [
  "Suggest GL account",
  "Generate report",
  "Analyze spending",
  "Find duplicates",
];

interface AIInputBarProps {
  onSubmit?: (query: string) => void;
  onFileStateChange?: (state: FileUploadState | null) => void;
}

export function AIInputBar({ onSubmit, onFileStateChange }: AIInputBarProps) {
  const [value, setValue] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
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
        <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-expanded={helpOpen}
              aria-label="AI help"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70 data-[state=open]:text-white/80"
            >
              <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-xl text-[13px]">
            <DropdownMenuLabel className="text-text-secondary">Tips</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-2 px-2 py-1.5 text-text-primary">
              {AI_HELP_TIPS.map((tip) => (
                <p key={tip} className="leading-snug text-[12px] text-text-secondary">
                  {tip}
                </p>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open={commandsOpen} onOpenChange={setCommandsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-expanded={commandsOpen}
              aria-label="AI commands"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70 data-[state=open]:text-white/80"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl text-[13px]">
            <DropdownMenuLabel className="text-text-secondary">Commands</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {AI_COMMANDS.map((cmd) => (
              <DropdownMenuItem key={cmd} className="cursor-default text-[12px] focus:bg-black/5">
                {cmd}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </form>
  );
}
