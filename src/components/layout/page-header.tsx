"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, Star, Eye } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showActions?: boolean;
}

const AVATAR_FALLBACK_COLORS = ["bg-blue-500", "bg-purple-500", "bg-orange-500"] as const;

function initialsFromName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TeamMemberRow {
  userName?: string | null;
  userEmail?: string | null;
}

export function PageHeader({ title, showActions = true }: PageHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [teamInitials, setTeamInitials] = useState<string[]>([]);

  const userName = session?.user?.name ?? "User";
  const userInitials = initialsFromName(userName);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: TeamMemberRow[] } | null) => {
        if (cancelled || !data?.members?.length) return;
        const initials = data.members
          .slice(0, 3)
          .map((m) => initialsFromName(m.userName ?? m.userEmail ?? undefined));
        setTeamInitials(initials);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const displayInitials = teamInitials.length > 0 ? teamInitials : [userInitials];

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="flex items-center justify-between py-4">
      <h1 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
        {title}
      </h1>
      {showActions && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
          >
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFavorited((v) => {
                const next = !v;
                toast(next ? "Page bookmarked" : "Bookmark removed");
                return next;
              });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
          >
            <Star
              className={cn("h-[18px] w-[18px]", isFavorited && "fill-amber-400 text-amber-500")}
              strokeWidth={1.8}
            />
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
              >
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent>View Options</TooltipContent>
          </Tooltip>

          {/* Avatar stack + Share */}
          <div className="ml-2 flex items-center">
            <div className="flex -space-x-2">
              {displayInitials.map((initials, i) => (
                <Avatar key={`${initials}-${i}`} className="h-7 w-7 border-2 border-surface">
                  <AvatarFallback
                    className={cn(
                      "text-[9px] font-semibold text-white",
                      AVATAR_FALLBACK_COLORS[i % AVATAR_FALLBACK_COLORS.length],
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className="ml-2 rounded-full bg-success px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-success/90"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
