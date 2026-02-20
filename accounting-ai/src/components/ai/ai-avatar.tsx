"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: { container: "h-6 w-6", ring: "ring-1" },
  sm: { container: "h-8 w-8", ring: "ring-1" },
  md: { container: "h-10 w-10", ring: "ring-2" },
  lg: { container: "h-14 w-14", ring: "ring-2" },
  xl: { container: "h-20 w-20", ring: "ring-2" },
  "2xl": { container: "h-28 w-28", ring: "ring-[3px]" },
} as const;

type AvatarSize = keyof typeof sizeMap;

interface AiAvatarProps {
  size?: AvatarSize;
  showRing?: boolean;
  showGlow?: boolean;
  className?: string;
  /** Override the default avatar image path */
  src?: string;
}

const FALLBACK_SRC = "/assets/ai-character/avatar-placeholder.svg";

/**
 * Reusable AI CPA character avatar.
 * 
 * Replace `/assets/ai-character/avatar.png` with the final anime artwork.
 * Falls back to the SVG placeholder automatically.
 * 
 * Sizes: xs (24px), sm (32px), md (40px), lg (56px), xl (80px), 2xl (112px)
 */
export function AiAvatar({
  size = "md",
  showRing = false,
  showGlow = false,
  className,
  src,
}: AiAvatarProps) {
  const primarySrc = src || "/assets/ai-character/avatar-placeholder.svg";
  const [imgSrc, setImgSrc] = useState(primarySrc);
  const { container, ring } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        container,
        showRing && `${ring} ring-success/40`,
        showGlow && "shadow-[0_0_16px_rgba(34,197,94,0.25)]",
        className
      )}
    >
      <Image
        src={imgSrc}
        alt="AI CPA Assistant"
        fill
        className="object-cover"
        unoptimized={imgSrc.endsWith(".svg")}
        onError={() => {
          if (imgSrc !== FALLBACK_SRC) setImgSrc(FALLBACK_SRC);
        }}
      />
    </div>
  );
}

/**
 * Animated variant with a subtle pulse glow — use in chat responses,
 * loading states, or the AI assistant panel header.
 */
export function AiAvatarAnimated({
  size = "md",
  ...props
}: AiAvatarProps) {
  return (
    <div className="relative">
      {/* Animated glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-success/20 animate-pulse",
          sizeMap[size].container
        )}
      />
      <AiAvatar size={size} showRing showGlow {...props} />
    </div>
  );
}
