"use client";

import Link from "next/link";
import { FolderOpen, ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-text-meta">
      <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="cursor-pointer hover:text-text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === items.length - 1
                  ? "font-medium text-text-secondary"
                  : ""
              }
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
