"use client";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  queued: { bg: "bg-gray-100", text: "text-gray-600", label: "Queued" },
  sent: { bg: "bg-blue-50", text: "text-blue-600", label: "Sent" },
  delivered: { bg: "bg-green-50", text: "text-green-600", label: "Delivered" },
  opened: { bg: "bg-purple-50", text: "text-purple-600", label: "Opened" },
  bounced: { bg: "bg-red-50", text: "text-red-600", label: "Bounced" },
  failed: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
};

interface EmailStatusBadgeProps {
  status: string;
}

export function EmailStatusBadge({ status }: EmailStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: status || "Unknown" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
