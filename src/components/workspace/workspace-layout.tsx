"use client";

import { useState, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface WorkspaceLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  defaultLeftSize?: number;
}

export function WorkspaceLayout({
  left,
  right,
  className,
  defaultLeftSize = 50,
}: WorkspaceLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="min-h-[300px]">{left}</div>
        <div>{right}</div>
      </div>
    );
  }

  return (
    <Group
      orientation="horizontal"
      className={cn("h-full", className)}
    >
      <Panel defaultSize={defaultLeftSize} minSize={30}>
        {left}
      </Panel>
      <Separator className="group relative flex w-2 items-center justify-center hover:bg-[var(--accent-ai)]/5 transition-colors">
        <div className="flex h-8 w-4 items-center justify-center rounded bg-border-subtle/60 group-hover:bg-[var(--accent-ai)]/30 transition-colors">
          <GripVertical className="h-3 w-3 text-text-meta group-hover:text-[var(--accent-ai)]" />
        </div>
      </Separator>
      <Panel defaultSize={100 - defaultLeftSize} minSize={30}>
        {right}
      </Panel>
    </Group>
  );
}
