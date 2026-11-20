"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";

type PayInfo = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customerName: string;
  orgName: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  provider: string;
};

export default function PublicPayPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/pay/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Invalid link");
        setInfo(json);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Invalid link");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-canvas px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-border-subtle bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
            <Link2 className="h-5 w-5 text-text-primary" />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide text-text-meta">
              Invoice payment
            </p>
            <h1 className="text-[18px] font-semibold text-text-primary">
              {info?.orgName ?? "Agar"}
            </h1>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-text-meta">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {error && (
          <p className="py-8 text-center text-[14px] text-error">{error}</p>
        )}

        {info && !loading && (
          <div className="space-y-4">
            <div className="rounded-xl bg-canvas px-4 py-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-text-meta">Invoice</span>
                <span className="font-semibold text-text-primary">{info.invoiceNumber}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-text-meta">Customer</span>
                <span className="text-text-primary">{info.customerName}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-text-meta">Amount</span>
                <span className="font-mono font-semibold text-text-primary">
                  {info.currency} {info.amount.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-text-meta">Status</span>
                <span className="capitalize text-text-primary">{info.status}</span>
              </div>
            </div>

            {info.status === "paid" ? (
              <p className="text-center text-[13px] text-success">
                This invoice payment has been received
                {info.paidAt ? ` on ${new Date(info.paidAt).toLocaleString()}` : ""}.
              </p>
            ) : info.status === "open" || info.status === "pending" ? (
              <p className="text-[13px] leading-relaxed text-text-secondary">
                This is a stub payment link (Stripe is not configured on this workspace).
                Ask the business to complete settlement, or configure Stripe Checkout for live card payments.
              </p>
            ) : (
              <p className="text-center text-[13px] text-text-meta">
                This payment link is {info.status}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
