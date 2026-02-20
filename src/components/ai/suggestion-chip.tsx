"use client";

import { Plus } from "lucide-react";

interface SuggestionChipProps {
  text: string;
  onClick?: () => void;
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] text-white/80 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
    >
      <span>{text}</span>
      <Plus className="h-3 w-3 opacity-50" strokeWidth={2} />
    </button>
  );
}
