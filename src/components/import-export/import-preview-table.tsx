"use client";

import { Fragment } from "react";
import { AlertCircle, Plus, RefreshCw, Ban } from "lucide-react";
import type { PreviewRow } from "@/lib/import-export/types";

interface ImportPreviewTableProps {
  rows: PreviewRow[];
  headers: string[];
}

const statusConfig = {
  create: {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-l-green-500",
    icon: <Plus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />,
    label: "New",
  },
  update: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-l-blue-500",
    icon: <RefreshCw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />,
    label: "Update",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-l-red-500",
    icon: <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
    label: "Error",
  },
  skipped: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-l-yellow-500",
    icon: <Ban className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />,
    label: "Skipped",
  },
};

export function ImportPreviewTable({ rows, headers }: ImportPreviewTableProps) {
  const displayHeaders = headers.slice(0, 6);
  const hasMore = headers.length > 6;
  const totalCols = 2 + displayHeaders.length + (hasMore ? 1 : 0);

  return (
    <div className="overflow-auto rounded-xl border border-border-subtle max-h-[400px]">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface-secondary">
          <tr>
            <th className="w-10 px-3 py-2 font-medium text-text-meta">#</th>
            <th className="w-20 px-3 py-2 font-medium text-text-meta">
              Status
            </th>
            {displayHeaders.map((h) => (
              <th
                key={h}
                className="px-3 py-2 font-medium text-text-meta whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            {hasMore && (
              <th className="px-3 py-2 font-medium text-text-meta">...</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row) => {
            const cfg = statusConfig[row.status];
            const hasMessages = row.errors.length > 0 || row.warnings.length > 0;
            return (
              <Fragment key={row.index}>
                <tr className={`${cfg.bg} border-l-4 ${cfg.border}`}>
                  <td className="px-3 py-2 text-text-meta">
                    {row.index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      {cfg.icon}
                      <span className="text-text-secondary">{cfg.label}</span>
                    </span>
                  </td>
                  {displayHeaders.map((h) => {
                    const val = row.rawRow?.[h] ?? "";
                    return (
                      <td
                        key={h}
                        className="px-3 py-2 text-text-primary max-w-[180px] truncate"
                      >
                        {val}
                      </td>
                    );
                  })}
                  {hasMore && (
                    <td className="px-3 py-2 text-text-meta">...</td>
                  )}
                </tr>
                {hasMessages && (
                  <tr className={`${cfg.bg} border-l-4 ${cfg.border}`}>
                    <td colSpan={totalCols} className="px-3 py-1">
                      {row.errors.map((e, i) => (
                        <p
                          key={`e-${i}`}
                          className="text-[11px] text-red-600 dark:text-red-400"
                        >
                          {e}
                        </p>
                      ))}
                      {row.warnings.map((w, i) => (
                        <p
                          key={`w-${i}`}
                          className="text-[11px] text-yellow-600 dark:text-yellow-400"
                        >
                          {w}
                        </p>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
