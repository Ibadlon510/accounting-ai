"use client";

import { Sparkles, Star, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { comingSoon } from "@/lib/utils/toast-helpers";

interface PageHeaderProps {
  title: string;
  showActions?: boolean;
}

export function PageHeader({ title, showActions = true }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <h1 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
        {title}
      </h1>
      {showActions && (
        <div className="flex items-center gap-2">
          <button onClick={() => comingSoon("AI Insights")} className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <button onClick={() => comingSoon("Favorites")} className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Star className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <button onClick={() => comingSoon("View Options")} className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>

          {/* Avatar stack + Share */}
          <div className="ml-2 flex items-center">
            <div className="flex -space-x-2">
              <Avatar className="h-7 w-7 border-2 border-surface">
                <AvatarFallback className="bg-blue-500 text-[9px] font-semibold text-white">
                  AK
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-surface">
                <AvatarFallback className="bg-purple-500 text-[9px] font-semibold text-white">
                  MR
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-surface">
                <AvatarFallback className="bg-orange-500 text-[9px] font-semibold text-white">
                  SJ
                </AvatarFallback>
              </Avatar>
            </div>
            <button onClick={() => comingSoon("Share")} className="ml-2 rounded-full bg-success px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-success/90">
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
