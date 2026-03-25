"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailStatusBadge } from "@/components/email/email-status-badge";
import { StyledSelect } from "@/components/ui/styled-select";
import { RefreshCw, Search, MailOpen, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  bill: "Bill",
  statement: "Statement",
  payment_receipt: "Receipt",
  payment_reminder: "Reminder",
  overdue_notice: "Overdue",
};

interface SentEmail {
  id: string;
  documentType: string;
  documentNumber: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  hasAttachment: boolean;
  createdAt: string;
  openedAt: string | null;
}

export function EmailHistorySettings() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (docTypeFilter) params.set("documentType", docTypeFilter);

      const res = await fetch(`/api/email/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails ?? []);
        setTotal(data.total ?? 0);
      } else {
        toast.error("Failed to load email history");
      }
    } catch {
      toast.error("Failed to load email history");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, docTypeFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/email/history/${id}/resend`, { method: "POST" });
      if (res.ok) {
        toast.success("Email resent");
        fetchHistory();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Resend failed");
      }
    } catch {
      toast.error("Resend failed");
    } finally {
      setResendingId(null);
    }
  };

  const filteredEmails = search
    ? emails.filter(
        (e) =>
          e.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
          (e.documentNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">Email History</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Track all document emails sent from your organization
            </p>
          </div>
          <Button onClick={fetchHistory} variant="outline" size="sm" className="gap-1.5 rounded-xl border-border-subtle text-[12px]">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-meta" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient, document #, or subject…"
              className="h-9 pl-8 text-[12px]"
            />
          </div>
          <StyledSelect value={docTypeFilter} onChange={(e) => { setDocTypeFilter(e.target.value); setPage(1); }} className="h-9 w-32 text-[12px]">
            <option value="">All Types</option>
            <option value="invoice">Invoice</option>
            <option value="bill">Bill</option>
            <option value="statement">Statement</option>
            <option value="payment_receipt">Receipt</option>
            <option value="payment_reminder">Reminder</option>
            <option value="overdue_notice">Overdue</option>
          </StyledSelect>
          <StyledSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 w-28 text-[12px]">
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="bounced">Bounced</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </StyledSelect>
        </div>
      </div>

      <div className="dashboard-card p-0">
        {loading ? (
          <div className="py-12 text-center text-text-secondary">Loading…</div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-12 text-center">
            <MailOpen className="mx-auto h-10 w-10 text-text-meta/30" />
            <p className="mt-3 text-[14px] text-text-secondary">No emails found</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/50 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-left">Type</th>
                  <th className="px-4 py-2.5 text-left">Doc #</th>
                  <th className="px-4 py-2.5 text-left">Recipient</th>
                  <th className="px-4 py-2.5 text-left">Subject</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="border-b border-border-subtle last:border-0 hover:bg-canvas/30 transition-colors">
                    <td className="px-4 py-2.5 text-[12px] text-text-meta">
                      {new Date(email.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5 text-[12px]">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium">
                        {DOC_TYPE_LABELS[email.documentType] ?? email.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-mono text-text-primary">{email.documentNumber ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-[12px] font-medium text-text-primary">{email.recipientEmail}</div>
                      {email.recipientName && <div className="text-[11px] text-text-meta">{email.recipientName}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary max-w-[200px] truncate">{email.subject}</td>
                    <td className="px-4 py-2.5"><EmailStatusBadge status={email.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleResend(email.id)}
                        disabled={resendingId === email.id}
                        title="Resend"
                      >
                        {resendingId === email.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
            <span className="text-[12px] text-text-meta">{total} emails total</span>
            <div className="flex gap-1">
              <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="px-3 py-1 text-[12px] text-text-meta">Page {page} of {totalPages}</span>
              <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
