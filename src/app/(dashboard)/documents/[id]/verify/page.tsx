"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { Sparkles, ShieldCheck, AlertTriangle, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { FileAwayAnimation } from "@/components/ui/motion-wrappers";
import { DuplicateWarning, type DuplicateMatch } from "@/components/ai/duplicate-warning";
import { WorkflowPreview } from "@/components/documents/workflow-preview";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { VerifyExpenseForm } from "@/components/documents/verify-expense-form";
import { VerifyInvoiceForm } from "@/components/documents/verify-invoice-form";
import { VerifyBillForm } from "@/components/documents/verify-bill-form";
import { VerifyBankStatement, type BankTransactionRow } from "@/components/documents/verify-bank-statement";
import { VerifyReceiptForm } from "@/components/documents/verify-receipt-form";
import { VerifyCreditNoteForm, type CreditNoteFormState } from "@/components/documents/verify-credit-note-form";
import type { ExtractedData, Account, Customer, Supplier, InvoiceLine, ExpenseLine } from "@/components/documents/verify-types";
import dynamic from "next/dynamic";
import type { BoundingBox } from "@/components/workspace/pdf-viewer";

const PdfViewer = dynamic(
  () => import("@/components/workspace/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-text-primary" /></div> }
);

type DocumentDoc = {
  id: string;
  s3Key: string;
  documentType: string | null;
  status: string;
  extractedData: ExtractedData | null;
  aiConfidence: number | null;
  lastError?: string | null;
};

function buildBoundingBoxes(ex: ExtractedData | null): BoundingBox[] {
  if (!ex) return [];
  const boxes: BoundingBox[] = [];
  const conf = ex.gl_prediction?.confidence ?? 0.8;
  if (ex.merchant?.name) {
    boxes.push({ field: "merchantName", x: 0.05, y: 0.05, width: 0.4, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.date) {
    boxes.push({ field: "date", x: 0.6, y: 0.05, width: 0.3, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.total_amount != null) {
    boxes.push({ field: "totalAmount", x: 0.55, y: 0.7, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.tax_amount != null) {
    boxes.push({ field: "vatAmount", x: 0.55, y: 0.65, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  if (ex.invoice?.net_amount != null) {
    boxes.push({ field: "netAmount", x: 0.55, y: 0.6, width: 0.35, height: 0.04, page: 1, confidence: conf });
  }
  return boxes;
}

function lineFromExtracted(ex: ExtractedData): InvoiceLine {
  const net = ex.invoice?.net_amount ?? 0;
  const tax = ex.invoice?.tax_amount ?? 0;
  const merchant = ex.merchant?.name ?? "Item";
  return {
    id: `new-${Date.now()}`,
    productId: "",
    description: merchant,
    quantity: 1,
    unitPrice: net,
    amount: net,
    taxRate: net > 0 ? Math.round((tax / net) * 100) : 5,
    taxAmount: tax,
  };
}

function expenseLineFromExtracted(ex: ExtractedData, defaultGlId: string): ExpenseLine {
  const base = lineFromExtracted(ex);
  return { ...base, glAccountId: defaultGlId || "" };
}

export default function DocumentVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [doc, setDoc] = useState<DocumentDoc | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; accountName: string; bankName: string; currency: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; customerId: string; invoiceNumber: string; total: number; amountDue: number }[]>([]);
  const [bills, setBills] = useState<{ id: string; supplierId: string; billNumber: string; total: number; amountDue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [manualEntry, setManualEntry] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const { zoom, rotation, zoomIn, zoomOut, rotateRight, setActiveField } = useWorkspaceStore();
  const initialGlRef = useRef<string>("");
  const initialMerchantRef = useRef<string>("");

  const [docTypeOverride, setDocTypeOverride] = useState<string | null>(null);
  const knownFormTypes = ["credit_note", "receipt", "sales_invoice", "purchase_invoice", "bank_statement"] as const;
  const docType = docTypeOverride ?? doc?.documentType ?? null;
  const useCreditNoteForm = docType === "credit_note";
  const useReceiptForm = docType === "receipt";
  const useInvoiceForm = docType === "sales_invoice";
  const useBillForm = docType === "purchase_invoice";
  const useBankForm = docType === "bank_statement";
  const useExpenseForm = !useCreditNoteForm && !useReceiptForm && !useInvoiceForm && !useBillForm && !useBankForm;

  const defaultExpenseLine = (accs: Account[]): ExpenseLine => {
    const defaultGlId = accs.find((a) => a.code === "6300" || a.code?.startsWith("6"))?.id ?? accs[0]?.id ?? "";
    return {
      id: `new-${Date.now()}-${Math.random()}`,
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 5,
      taxAmount: 0,
      glAccountId: defaultGlId,
    };
  };

  const [expenseForm, setExpenseForm] = useState<{
    date: string;
    currency: string;
    merchantName: string;
    supplierId: string;
    lines: ExpenseLine[];
  }>({
    date: new Date().toISOString().slice(0, 10),
    currency: "AED",
    merchantName: "",
    supplierId: "",
    lines: [],
  });
  const [expenseBankAccountId, setExpenseBankAccountId] = useState("");

  const emptyLine = (): InvoiceLine => ({
    id: `new-${Date.now()}-${Math.random()}`,
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 5,
    taxAmount: 0,
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(),
    lines: [emptyLine()] as InvoiceLine[],
  });

  const [billForm, setBillForm] = useState({
    supplierId: "",
    billNumber: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(),
    lines: [emptyLine()] as InvoiceLine[],
  });

  const [bankAccountId, setBankAccountId] = useState("");

  const [receiptForm, setReceiptForm] = useState({
    receiptType: "sales" as "sales" | "purchase",
    date: new Date().toISOString().slice(0, 10),
    customerId: "",
    supplierId: "",
    totalAmount: "",
    allocations: [{ id: `alloc-${Date.now()}`, documentId: "", amount: 0 }],
    bankAccountId: "",
  });

  const [creditNoteForm, setCreditNoteForm] = useState<CreditNoteFormState>({
    creditNoteType: "sales",
    date: new Date().toISOString().slice(0, 10),
    creditNoteNumber: "",
    customerId: "",
    supplierId: "",
    linkedInvoiceId: "",
    linkedBillId: "",
    lines: [emptyLine()],
  });

  const overallConfidence = doc?.aiConfidence ?? 0;
  const ex = doc?.extractedData ?? null;
  const mathOk = ex?.validation?.math_check_passed !== false;

  const extractedBankTxns: BankTransactionRow[] = (ex && "transactions" in ex && Array.isArray((ex as { transactions?: BankTransactionRow[] }).transactions))
    ? (ex as { transactions: BankTransactionRow[] }).transactions
    : [];
  const [bankTransactions, setBankTransactions] = useState<BankTransactionRow[]>([]);
  const bankTxnInitRef = useRef(false);
  useEffect(() => {
    if (extractedBankTxns.length > 0 && !bankTxnInitRef.current) {
      setBankTransactions(extractedBankTxns);
      bankTxnInitRef.current = true;
    }
  }, [extractedBankTxns]);

  const fieldConfidence = useCallback((fieldName: string): number | undefined => {
    if (!ex) return undefined;
    if (fieldName === "glAccountId") return ex.gl_prediction?.confidence;
    return overallConfidence;
  }, [ex, overallConfidence]);

  useEffect(() => {
    if (!id) return;
    setDocumentNotFound(false);
    Promise.all([
      fetch(`/api/documents/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/org/chart-of-accounts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { accounts: [] })),
      fetch("/api/sales/customers", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { customers: [] })),
      fetch("/api/purchases/suppliers", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { suppliers: [] })),
      fetch("/api/banking", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { accounts: [] })),
      fetch("/api/sales/invoices", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { invoices: [] })),
      fetch("/api/purchases/bills", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { bills: [] })),
    ])
      .then(([docData, accData, custData, suppData, bankData, invData, billData]) => {
        const accList = (accData.accounts ?? []) as Account[];
        const custList = (custData.customers ?? []) as Customer[];
        const suppList = (suppData.suppliers ?? []) as Supplier[];
        const bankList = (bankData.accounts ?? []).map((a: { id: string; accountName: string; bankName: string; currency: string }) => ({
          id: a.id,
          accountName: a.accountName,
          bankName: a.bankName ?? "",
          currency: a.currency ?? "AED",
        }));

        if (docData) {
          setDoc(docData);
          setDocumentNotFound(false);
          const extracted = docData.extractedData as ExtractedData | null;
          const matchGl = extracted?.gl_prediction?.code
            ? accList.find((a) => extracted!.gl_prediction!.code!.startsWith(a.code) || extracted!.gl_prediction!.code!.includes(a.name))
            : null;
          const glId = matchGl?.id ?? accList.find((a) => a.code === "6300" || a.code?.startsWith("6"))?.id ?? accList[0]?.id ?? "";

          if (extracted?.invoice || extracted?.merchant) {
            const merchant = extracted.merchant?.name ?? "";
            initialGlRef.current = glId;
            initialMerchantRef.current = merchant;
            const invDate = extracted.invoice?.date ?? new Date().toISOString().slice(0, 10);
            const dueDate = (() => { const d = new Date(invDate); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
            const suppMatch = suppList.find((s) => merchant && s.name.toLowerCase().includes(merchant.toLowerCase()));
            setExpenseForm((f) => ({
              ...f,
              date: invDate,
              currency: extracted.invoice?.currency ?? f.currency,
              merchantName: (suppMatch?.name ?? merchant) || f.merchantName,
              supplierId: suppMatch?.id ?? f.supplierId,
              lines: [expenseLineFromExtracted(extracted, glId)],
            }));
            const custMatch = custList.find((c) => merchant && c.name.toLowerCase().includes(merchant.toLowerCase()));
            setInvoiceForm((f) => ({
              ...f,
              issueDate: invDate,
              dueDate,
              lines: [lineFromExtracted(extracted)],
              customerId: custMatch?.id ?? f.customerId,
            }));
            setBillForm((f) => ({
              ...f,
              billNumber: extracted.invoice?.invoice_number ?? "",
              issueDate: invDate,
              dueDate,
              lines: [{ ...lineFromExtracted(extracted), glAccountId: glId }],
              supplierId: suppMatch?.id ?? f.supplierId,
            }));
          }
          if (accList.length > 0) {
            setExpenseForm((f) => (f.lines.length === 0 ? { ...f, lines: [defaultExpenseLine(accList)] } : f));
          }
        }
        setViewUrl(`/api/documents/${id}/file`);
        setAccounts(accList);
        setCustomers(custList);
        setSuppliers(suppList);
        setBankAccounts(bankList);
        if (bankList.length > 0) setBankAccountId((prev) => prev || bankList[0].id);
        if (bankList.length > 0) setExpenseBankAccountId((prev) => prev || bankList[0].id);

        type InvItem = { id: string; customerId: string; invoiceNumber: string; total: number; amountDue: number; status?: string };
        type BillItem = { id: string; supplierId: string; billNumber: string; total: number; amountDue: number };
        const invList = ((invData as { invoices?: InvItem[] }).invoices ?? [])
          .filter((inv) => inv.status !== "draft")
          .map((inv) => ({
          id: inv.id,
          customerId: inv.customerId,
          invoiceNumber: inv.invoiceNumber,
          total: inv.total,
          amountDue: inv.amountDue,
        }));
        const billList = ((billData as { bills?: BillItem[] }).bills ?? []).map((bill) => ({
          id: bill.id,
          supplierId: bill.supplierId,
          billNumber: bill.billNumber,
          total: bill.total,
          amountDue: bill.amountDue,
        }));
        setInvoices(invList);
        setBills(billList);

        if (docData?.extractedData && (docData.extractedData as ExtractedData).document_type === "receipt") {
          const ext = docData.extractedData as ExtractedData;
          const invDate = ext.invoice?.date ?? new Date().toISOString().slice(0, 10);
          const total = ext.invoice?.total_amount ?? 0;
          const merchant = ext.merchant?.name ?? "";
          const custMatch = custList.find((c) => merchant && c.name.toLowerCase().includes(merchant.toLowerCase()));
          const suppMatch = suppList.find((s) => merchant && s.name.toLowerCase().includes(merchant.toLowerCase()));

          const autoAllocations: { id: string; documentId: string; amount: number }[] = [];
          if (custMatch && total > 0) {
            const matchInv = invList.find((inv) => inv.customerId === custMatch.id && inv.amountDue > 0 && Math.abs(inv.amountDue - total) < 0.02);
            if (matchInv) autoAllocations.push({ id: `alloc-${Date.now()}`, documentId: matchInv.id, amount: total });
          }
          if (suppMatch && total > 0 && autoAllocations.length === 0) {
            const matchBill = billList.find((b) => b.supplierId === suppMatch.id && b.amountDue > 0 && Math.abs(b.amountDue - total) < 0.02);
            if (matchBill) autoAllocations.push({ id: `alloc-${Date.now()}`, documentId: matchBill.id, amount: total });
          }

          setReceiptForm((f) => ({
            ...f,
            date: invDate,
            totalAmount: total > 0 ? String(total) : f.totalAmount,
            customerId: custMatch?.id ?? f.customerId,
            supplierId: suppMatch?.id ?? f.supplierId,
            receiptType: suppMatch && !custMatch ? "purchase" : f.receiptType,
            allocations: autoAllocations.length > 0 ? autoAllocations : f.allocations,
          }));
        }

        if (!docData) {
          setDocumentNotFound(true);
        }

        if (docData?.extractedData && (docData.extractedData as ExtractedData).document_type === "credit_note") {
          const ext = docData.extractedData as ExtractedData;
          const cnDate = ext.invoice?.date ?? new Date().toISOString().slice(0, 10);
          const merchant = ext.merchant?.name ?? "";
          const custMatch = custList.find((c) => merchant && c.name.toLowerCase().includes(merchant.toLowerCase()));
          const suppMatch = suppList.find((s) => merchant && s.name.toLowerCase().includes(merchant.toLowerCase()));
          setCreditNoteForm((f) => ({
            ...f,
            date: cnDate,
            creditNoteNumber: ext.invoice?.invoice_number ?? f.creditNoteNumber,
            creditNoteType: suppMatch && !custMatch ? "purchase" : "sales",
            customerId: custMatch?.id ?? f.customerId,
            supplierId: suppMatch?.id ?? f.supplierId,
            lines: ext.invoice?.total_amount ? [{
              id: `cn-${Date.now()}`,
              description: "Credit note line",
              quantity: 1,
              unitPrice: ext.invoice.net_amount ?? ext.invoice.total_amount - (ext.invoice.tax_amount ?? 0),
              amount: ext.invoice.net_amount ?? ext.invoice.total_amount - (ext.invoice.tax_amount ?? 0),
              taxRate: ext.invoice.tax_amount && ext.invoice.net_amount ? Math.round((ext.invoice.tax_amount / ext.invoice.net_amount) * 100) : 5,
              taxAmount: ext.invoice.tax_amount ?? 0,
            }] : f.lines,
          }));
        }

        const ext = docData?.extractedData as ExtractedData | null;
        const merchant = ext?.merchant?.name?.trim();
        const amount = ext?.invoice?.total_amount;
        const newDate = ext?.invoice?.date ?? "";
        if (merchant && amount != null) {
          const qs = new URLSearchParams({ merchantName: merchant, amount: String(amount), excludeDocumentId: id });
          if (newDate) qs.set("date", newDate);
          fetch(`/api/documents/duplicates?${qs}`)
            .then((r) => (r.ok ? r.json() : { duplicates: [] }))
            .then((data) => {
              const list = (data.duplicates ?? []) as Array<{ documentId: string; merchantName: string; amount: number; date: string; similarity: number }>;
              setDuplicates(list.map((d, i) => ({
                id: `dup-${d.documentId}-${i}`,
                existingDocId: d.documentId,
                merchant: d.merchantName,
                amount: d.amount,
                existingDate: d.date,
                newDate: newDate || "Unknown",
                similarity: d.similarity,
              })));
            })
            .catch(() => setDuplicates([]));
        }
      })
      .catch(() => {
        setDocumentNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = expenseForm.lines.reduce((s, l) => s + l.amount, 0);
    const taxAmount = expenseForm.lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxAmount;
    const supplier = suppliers.find((s) => s.id === expenseForm.supplierId);
    if (!supplier || expenseForm.lines.some((l) => !l.glAccountId || !l.description.trim())) return;
    const merchantName = supplier.name.trim();
    const firstGl = expenseForm.lines[0]?.glAccountId ?? "";
    const glChanged = initialGlRef.current && firstGl !== initialGlRef.current;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "expense",
          date: expenseForm.date,
          currency: expenseForm.currency,
          merchantName,
          supplierId: expenseForm.supplierId || undefined,
          bankAccountId: expenseBankAccountId || undefined,
          lines: expenseForm.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            taxRate: l.taxRate,
            taxAmount: l.taxAmount,
            glAccountId: l.glAccountId,
          })),
          subtotal,
          taxAmount,
          total,
        }),
      });
      if (res.ok) {
        if (glChanged) {
          const newAcc = accounts.find((a) => a.id === firstGl);
          showSuccess("Preference saved", `We'll remember ${newAcc?.name ?? "this category"} for ${merchantName} next time.`);
        } else {
          showSuccess("Verified", `Document for ${merchantName} has been filed.`);
        }
        await advanceToNext();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Verification failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleInvoiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = invoiceForm.lines.reduce((s, l) => s + l.amount, 0);
    const taxAmount = invoiceForm.lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxAmount;
    const customer = customers.find((c) => c.id === invoiceForm.customerId);
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "invoice",
          customerId: invoiceForm.customerId,
          customerName: customer?.name ?? "",
          issueDate: invoiceForm.issueDate,
          dueDate: invoiceForm.dueDate,
          lines: invoiceForm.lines,
          subtotal,
          taxAmount,
          total,
        }),
      });
      if (res.ok) {
        showSuccess("Invoice created", `Invoice for AED ${total.toFixed(2)} has been created.`);
        await advanceToNext();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Verification failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleBillSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = billForm.lines.reduce((s, l) => s + l.amount, 0);
    const taxAmount = billForm.lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxAmount;
    const supplier = suppliers.find((s) => s.id === billForm.supplierId);
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "bill",
          supplierId: billForm.supplierId,
          supplierName: supplier?.name ?? "",
          billNumber: billForm.billNumber.trim(),
          issueDate: billForm.issueDate,
          dueDate: billForm.dueDate,
          lines: billForm.lines,
          subtotal,
          taxAmount,
          total,
        }),
      });
      if (res.ok) {
        showSuccess("Bill recorded", `Bill ${billForm.billNumber} for AED ${total.toFixed(2)} has been recorded.`);
        await advanceToNext();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Verification failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReceiptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totalAmount = parseFloat(receiptForm.totalAmount) || 0;
    if (receiptForm.receiptType === "sales") {
      if (!receiptForm.customerId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/documents/${id}/verify`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "receipt",
            receiptType: "sales",
            date: receiptForm.date,
            customerId: receiptForm.customerId,
            totalAmount,
            allocations: receiptForm.allocations.filter((a) => a.documentId && a.amount > 0).map((a) => ({ invoiceId: a.documentId, amount: a.amount })),
            bankAccountId: receiptForm.bankAccountId || undefined,
          }),
        });
        if (res.ok) {
          showSuccess("Payment recorded", `AED ${totalAmount.toFixed(2)} received and allocated.`);
          await advanceToNext();
        } else {
          const data = await res.json().catch(() => ({}));
          showError("Verification failed", data.error ?? "Please try again.");
        }
      } finally {
        setSaving(false);
      }
    } else {
      if (!receiptForm.supplierId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/documents/${id}/verify`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "receipt",
            receiptType: "purchase",
            date: receiptForm.date,
            supplierId: receiptForm.supplierId,
            totalAmount,
            allocations: receiptForm.allocations.filter((a) => a.documentId && a.amount > 0).map((a) => ({ billId: a.documentId, amount: a.amount })),
            bankAccountId: receiptForm.bankAccountId || undefined,
          }),
        });
        if (res.ok) {
          showSuccess("Payment recorded", `AED ${totalAmount.toFixed(2)} paid and allocated.`);
          await advanceToNext();
        } else {
          const data = await res.json().catch(() => ({}));
          showError("Verification failed", data.error ?? "Please try again.");
        }
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "bank_statement",
          bankAccountId,
          transactions: bankTransactions,
        }),
      });
      if (res.ok) {
        showSuccess("Imported", `${bankTransactions.length} transactions added to bank account.`);
        await advanceToNext();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Import failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreditNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = creditNoteForm.lines.reduce((s, l) => s + l.amount, 0);
    const taxAmount = creditNoteForm.lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxAmount;
    const isSales = creditNoteForm.creditNoteType === "sales";
    const entityName = isSales
      ? customers.find((c) => c.id === creditNoteForm.customerId)?.name ?? ""
      : suppliers.find((s) => s.id === creditNoteForm.supplierId)?.name ?? "";
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "credit_note",
          creditNoteType: creditNoteForm.creditNoteType,
          date: creditNoteForm.date,
          creditNoteNumber: creditNoteForm.creditNoteNumber,
          customerId: isSales ? creditNoteForm.customerId : undefined,
          customerName: isSales ? entityName : undefined,
          supplierId: !isSales ? creditNoteForm.supplierId : undefined,
          supplierName: !isSales ? entityName : undefined,
          linkedInvoiceId: isSales ? creditNoteForm.linkedInvoiceId || undefined : undefined,
          linkedBillId: !isSales ? creditNoteForm.linkedBillId || undefined : undefined,
          lines: creditNoteForm.lines,
          subtotal,
          taxAmount,
          total,
        }),
      });
      if (res.ok) {
        showSuccess("Credit note created", `Credit note for AED ${total.toFixed(2)} has been recorded.`);
        await advanceToNext();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Verification failed", data.error ?? "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function advanceToNext() {
    let nextRoute = "/documents";
    try {
      const docsRes = await fetch("/api/documents", { cache: "no-store" });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        const pending = (docsData.documents ?? []).filter(
          (d: { id: string; status: string }) => d.id !== id && (d.status === "PENDING" || d.status === "FLAGGED")
        );
        if (pending.length > 0) {
          showSuccess("Next document", `${pending.length} document${pending.length > 1 ? "s" : ""} remaining in queue.`);
          nextRoute = `/documents/${pending[0].id}/verify`;
        }
      }
    } catch { /* fall through */ }
    pendingNavRef.current = nextRoute;
    setShowContent(false);
  }

  async function handleProcess() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${id}/process`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.extractedData) {
          const extracted = data.extractedData as ExtractedData & { transactions?: BankTransactionRow[] };
          const docType = extracted.document_type ?? (extracted.transactions ? "bank_statement" : null);
          setDoc((d) => (d ? { ...d, status: "PENDING", extractedData: extracted, aiConfidence: data.confidence, documentType: docType ?? d.documentType } : d));
          if (extracted.invoice || extracted.merchant) {
            const invDate = extracted.invoice?.date ?? new Date().toISOString().slice(0, 10);
            const dueDate = (() => { const d = new Date(invDate); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
            const merchant = extracted.merchant?.name ?? "";
            const matchGl = extracted.gl_prediction?.code
              ? accounts.find((a) => extracted.gl_prediction!.code!.startsWith(a.code) || extracted.gl_prediction!.code!.includes(a.name))
              : null;
            const glId = matchGl?.id ?? accounts.find((a) => a.code === "6300" || a.code?.startsWith("6"))?.id ?? accounts[0]?.id ?? "";
            const suppMatch = suppliers.find((s) => merchant && s.name.toLowerCase().includes(merchant.toLowerCase()));
            setExpenseForm((f) => ({
              ...f,
              date: invDate,
              currency: extracted.invoice?.currency ?? f.currency,
              merchantName: (suppMatch?.name ?? merchant) || f.merchantName,
              supplierId: suppMatch?.id ?? f.supplierId,
              lines: [expenseLineFromExtracted(extracted, glId)],
            }));
            setInvoiceForm((f) => ({ ...f, issueDate: invDate, dueDate, lines: [lineFromExtracted(extracted)] }));
            setBillForm((f) => ({ ...f, billNumber: extracted.invoice?.invoice_number ?? "", issueDate: invDate, dueDate, lines: [{ ...lineFromExtracted(extracted), glAccountId: glId }] }));
          }
          showSuccess(extracted.transactions ? "Transactions extracted" : "Extraction complete", extracted.transactions ? `Found ${extracted.transactions.length} transactions. Please review.` : "AI has filled in the details. Please review.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showError("Processing failed", err.error ?? "Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents", href: "/documents" }, { label: "Verify" }]} />
        <div className="dashboard-card py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-text-primary" />
          <p className="mt-3 text-[13px] text-text-secondary">Loading document...</p>
        </div>
      </>
    );
  }

  const expenseSubtotal = expenseForm.lines.reduce((s, l) => s + l.amount, 0);
  const expenseTax = expenseForm.lines.reduce((s, l) => s + l.taxAmount, 0);
  const expenseTotal = expenseSubtotal + expenseTax;

  const workflowProps = {
    documentType: docType,
    className: "mb-4",
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Documents", href: "/documents" }, { label: "Verify" }]} />

      {doc?.aiConfidence != null && (
        <div className={`mb-4 flex items-center gap-3 rounded-2xl px-5 py-3 text-[13px] font-medium ${
          doc.aiConfidence >= 0.9 ? "bg-[var(--confidence-high)]/10 text-[var(--confidence-high)]" :
          doc.aiConfidence >= 0.7 ? "bg-[var(--confidence-medium)]/10 text-amber-700" :
          "bg-[var(--confidence-low)]/10 text-[var(--confidence-low)]"
        }`}>
          {doc.aiConfidence >= 0.9 ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          AI confidence: {Math.round(doc.aiConfidence * 100)}%
          {!mathOk && docType !== "bank_statement" && <span className="ml-2 text-[var(--confidence-low)]">• Math check failed</span>}
          {ex?.validation?.issues?.map((issue, i) => (
            <span key={i} className="ml-2 text-[var(--confidence-low)]">• {issue}</span>
          ))}
        </div>
      )}

      {duplicates.length > 0 && <DuplicateWarning duplicates={duplicates} className="mb-4" />}

      <FileAwayAnimation show={showContent} onComplete={() => { if (pendingNavRef.current) { router.push(pendingNavRef.current); router.refresh(); } }}>
        <div style={{ minHeight: "calc(100vh - 200px)" }}>
          <WorkspaceLayout
            defaultLeftSize={50}
            left={
              <div className="dashboard-card flex h-full flex-col !p-0 overflow-hidden !rounded-r-none">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                  <h3 className="text-[13px] font-semibold text-text-primary">Document Preview</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={zoomOut} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5" title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="min-w-[3rem] text-center text-[11px] font-medium text-text-meta">{zoom}%</span>
                    <button onClick={zoomIn} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5" title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
                    <button onClick={rotateRight} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5" title="Rotate"><RotateCw className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
                  {viewUrl ? (
                    doc?.s3Key?.toLowerCase().endsWith(".pdf") ? (
                      <PdfViewer url={viewUrl} boundingBoxes={buildBoundingBoxes(ex)} onFieldClick={(field) => setActiveField(field)} className="h-full p-4" />
                    ) : /\.(csv|xls|xlsx)$/i.test(doc?.s3Key ?? "") ? (
                      <div className="flex min-h-full items-center justify-center p-8">
                        <p className="text-center text-[13px] text-text-secondary">Spreadsheet file — review extracted transactions in the verification panel.</p>
                      </div>
                    ) : (
                      <div className="flex min-h-full items-start justify-center p-4">
                        <img src={viewUrl} alt="Document" className="border border-border-subtle bg-white shadow-sm" style={{ maxWidth: `${zoom}%`, borderRadius: 12, transform: `rotate(${rotation}deg)` }} />
                      </div>
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center p-8"><p className="text-text-secondary text-[14px]">Preview not available.</p></div>
                  )}
                </div>
              </div>
            }
            right={
              <div className="dashboard-card flex h-full flex-col !rounded-l-none overflow-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-text-primary">Verification</h3>
                  {ex && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-ai)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--accent-ai)]">
                      <Sparkles className="h-3 w-3" /> AI Extracted
                    </span>
                  )}
                </div>

                {documentNotFound && !loading && (
                  <div className="mb-4 rounded-xl border border-error/30 bg-error/5 p-5 text-center">
                    <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-error" />
                    <p className="text-[13px] font-medium text-text-primary">Document not found or failed to load.</p>
                    <Link href="/documents" className="mt-3 inline-block text-[13px] font-medium text-[var(--accent-ai)] hover:underline">Back to Documents</Link>
                  </div>
                )}

                {(doc?.status === "PROCESSED" || doc?.status === "ARCHIVED") && (
                  <div className="mb-4 rounded-xl border border-border-subtle bg-muted/20 p-5 text-center">
                    <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-success" />
                    <p className="text-[13px] font-medium text-text-primary">This document has already been verified and filed.</p>
                    <Link href="/documents" className="mt-3 inline-block text-[13px] font-medium text-[var(--accent-ai)] hover:underline">Back to Documents</Link>
                  </div>
                )}

                {(doc?.extractedData || manualEntry) && doc?.status !== "PROCESSED" && !useBankForm && (
                  <div className="mb-4 flex items-center gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">Document type</label>
                    <SearchableSelect
                      value={docType && knownFormTypes.includes(docType as typeof knownFormTypes[number]) ? docType : ""}
                      onChange={(v) => setDocTypeOverride(v || null)}
                      options={[
                        { value: "", label: "Expense (default)" },
                        { value: "purchase_invoice", label: "Purchase Invoice (Bill)" },
                        { value: "sales_invoice", label: "Sales Invoice" },
                        { value: "receipt", label: "Receipt / Payment" },
                        { value: "credit_note", label: "Credit Note" },
                      ]}
                      placeholder="Expense (default)"
                      searchPlaceholder="Search document type..."
                      className="min-w-[180px]"
                    />
                    {docTypeOverride && docTypeOverride !== doc?.documentType && (
                      <button
                        type="button"
                        onClick={() => setDocTypeOverride(null)}
                        className="text-[11px] text-text-meta hover:text-text-secondary underline"
                      >
                        Reset to AI
                      </button>
                    )}
                  </div>
                )}

                {!doc?.extractedData && !manualEntry && doc?.status !== "PROCESSED" && doc != null && (
                  <div className={`mb-4 rounded-xl border-2 border-dashed p-5 text-center ${doc?.status === "PROCESSING_FAILED" ? "border-error/30 bg-error/5" : "border-[var(--accent-ai)]/30 bg-[var(--accent-ai)]/5"}`}>
                    {doc?.status === "PROCESSING_FAILED" ? <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-error" /> : <Sparkles className="mx-auto mb-2 h-6 w-6 text-[var(--accent-ai)]" />}
                    <p className="text-[13px] font-medium text-text-primary">
                      {doc?.status === "PROCESSING_FAILED" ? "AI extraction failed" : "This document hasn't been processed yet"}
                    </p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {doc?.status === "PROCESSING_FAILED" ? "Click below to retry AI extraction or fill in manually" : "Let AI extract the details automatically"}
                    </p>
                    {doc?.status === "PROCESSING_FAILED" && doc.lastError && (
                      <p className="mx-auto mt-2 max-w-md text-[11px] text-error/70 break-words">
                        {doc.lastError.length > 200 ? doc.lastError.slice(0, 200) + "…" : doc.lastError}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <Button type="button" className={`gap-2 rounded-xl px-5 text-[13px] font-semibold text-white ${doc?.status === "PROCESSING_FAILED" ? "bg-error hover:bg-error/90" : "bg-[var(--accent-ai)] hover:bg-[var(--accent-ai)]/90"}`} disabled={processing} onClick={handleProcess}>
                        {doc?.status === "PROCESSING_FAILED" ? <RotateCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        {processing ? "Processing..." : doc?.status === "PROCESSING_FAILED" ? "Retry Extraction" : "Process with AI"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 rounded-xl px-5 text-[13px] font-semibold"
                        onClick={() => {
                          setManualEntry(true);
                          if (expenseForm.lines.length === 0 && accounts.length > 0) {
                            setExpenseForm((f) => ({ ...f, lines: [defaultExpenseLine(accounts)] }));
                          }
                        }}
                      >
                        Fill in Manually
                      </Button>
                    </div>
                  </div>
                )}

                {(doc?.extractedData || manualEntry) && doc?.status !== "PROCESSED" && (
                  <>
                    {useExpenseForm && (
                      <>
                        <WorkflowPreview {...workflowProps} summary={`Will create expense entry (${expenseForm.lines.length} line${expenseForm.lines.length !== 1 ? "s" : ""}) for ${suppliers.find((s) => s.id === expenseForm.supplierId)?.name ?? "supplier"}, post to GL.`} nextStep="View in General Ledger" nextStepHref="/accounting/general-ledger" />
                        <VerifyExpenseForm
                          form={expenseForm}
                          setForm={setExpenseForm}
                          accounts={accounts}
                          suppliers={suppliers}
                          setSuppliers={setSuppliers}
                          bankAccounts={bankAccounts}
                          bankAccountId={expenseBankAccountId}
                          setBankAccountId={setExpenseBankAccountId}
                          fieldConfidence={fieldConfidence}
                          ex={ex}
                          saving={saving}
                          shakeBtn={shakeBtn}
                          setShakeBtn={setShakeBtn}
                          onSubmit={handleExpenseSubmit}
                        />
                      </>
                    )}
                    {useReceiptForm && (
                      <>
                        <WorkflowPreview
                          {...workflowProps}
                          summary={
                            receiptForm.receiptType === "sales"
                              ? `Will record payment received from ${customers.find((c) => c.id === receiptForm.customerId)?.name ?? "customer"} (${receiptForm.allocations.filter((a) => a.amount > 0).length} allocation${receiptForm.allocations.filter((a) => a.amount > 0).length !== 1 ? "s" : ""}).`
                              : `Will record payment made to ${suppliers.find((s) => s.id === receiptForm.supplierId)?.name ?? "supplier"} (${receiptForm.allocations.filter((a) => a.amount > 0).length} allocation${receiptForm.allocations.filter((a) => a.amount > 0).length !== 1 ? "s" : ""}).`
                          }
                          nextStep={receiptForm.receiptType === "sales" ? "View in Sales > Payments" : "View in Purchases"}
                          nextStepHref={receiptForm.receiptType === "sales" ? "/sales/payments" : "/purchases/bills"}
                        />
                        <VerifyReceiptForm
                          form={receiptForm}
                          setForm={setReceiptForm}
                          customers={customers}
                          setCustomers={setCustomers}
                          suppliers={suppliers}
                          setSuppliers={setSuppliers}
                          invoices={invoices}
                          bills={bills}
                          bankAccounts={bankAccounts}
                          saving={saving}
                          onSubmit={handleReceiptSubmit}
                        />
                      </>
                    )}
                    {useInvoiceForm && (
                      <>
                        <WorkflowPreview {...workflowProps} summary={`Will create 1 Sales Invoice for ${customers.find((c) => c.id === invoiceForm.customerId)?.name ?? "customer"}, post to AR.`} nextStep="View in Sales > Invoices" nextStepHref="/sales/invoices" />
                        <VerifyInvoiceForm form={invoiceForm} setForm={setInvoiceForm} customers={customers} setCustomers={setCustomers} saving={saving} onSubmit={handleInvoiceSubmit} />
                      </>
                    )}
                    {useBillForm && (
                      <>
                        <WorkflowPreview {...workflowProps} summary={`Will create 1 Bill for ${suppliers.find((s) => s.id === billForm.supplierId)?.name ?? "supplier"}, post to AP.`} nextStep="View in Purchases > Bills" nextStepHref="/purchases/bills" />
                        <VerifyBillForm form={billForm} setForm={setBillForm} suppliers={suppliers} setSuppliers={setSuppliers} accounts={accounts} saving={saving} onSubmit={handleBillSubmit} />
                      </>
                    )}
                    {useCreditNoteForm && (
                      <>
                        <WorkflowPreview
                          {...workflowProps}
                          summary={
                            creditNoteForm.creditNoteType === "sales"
                              ? `Will create sales credit note for ${customers.find((c) => c.id === creditNoteForm.customerId)?.name ?? "customer"}, reverse AR.`
                              : `Will create purchase credit note for ${suppliers.find((s) => s.id === creditNoteForm.supplierId)?.name ?? "supplier"}, reverse AP.`
                          }
                          nextStep={creditNoteForm.creditNoteType === "sales" ? "View in Sales > Invoices" : "View in Purchases > Bills"}
                          nextStepHref={creditNoteForm.creditNoteType === "sales" ? "/sales/invoices" : "/purchases/bills"}
                        />
                        <VerifyCreditNoteForm
                          form={creditNoteForm}
                          setForm={setCreditNoteForm}
                          customers={customers}
                          setCustomers={setCustomers}
                          suppliers={suppliers}
                          setSuppliers={setSuppliers}
                          invoices={invoices}
                          bills={bills}
                          saving={saving}
                          onSubmit={handleCreditNoteSubmit}
                        />
                      </>
                    )}
                    {useBankForm && (
                      <>
                        <WorkflowPreview {...workflowProps} summary={`Will add ${bankTransactions.length} transactions to bank account. Next: Reconcile & match to GL.`} nextStep="Reconcile in Banking" nextStepHref="/banking" />
                        <VerifyBankStatement
                          transactions={bankTransactions}
                          onTransactionsChange={setBankTransactions}
                          bankAccounts={bankAccounts}
                          bankAccountId={bankAccountId}
                          setBankAccountId={setBankAccountId}
                          saving={saving}
                          onSubmit={handleBankSubmit}
                        />
                      </>
                    )}
                  </>
                )}

                <div className="mt-4">
                  <Link href="/documents"><Button type="button" variant="ghost" className="rounded-xl text-[13px]">Cancel</Button></Link>
                </div>
              </div>
            }
          />
        </div>
      </FileAwayAnimation>
    </>
  );
}
