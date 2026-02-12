export interface VATReturn {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "filed" | "amended";
  taxableSales: number;
  exemptSales: number;
  zeroRatedSales: number;
  outputVat: number;
  taxablePurchases: number;
  inputVat: number;
  netVat: number;
  filedAt?: string;
}

export const mockVATReturns: VATReturn[] = [
  {
    id: "vat-q4-2025",
    periodStart: "2025-10-01",
    periodEnd: "2025-12-31",
    status: "filed",
    taxableSales: 420000,
    exemptSales: 0,
    zeroRatedSales: 15000,
    outputVat: 21000,
    taxablePurchases: 180000,
    inputVat: 9000,
    netVat: 12000,
    filedAt: "2026-01-28",
  },
  {
    id: "vat-q1-2026",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    status: "draft",
    taxableSales: 230000,
    exemptSales: 0,
    zeroRatedSales: 0,
    outputVat: 11500,
    taxablePurchases: 37800,
    inputVat: 1890,
    netVat: 9610,
  },
];

export function getVATSummary() {
  const currentReturn = mockVATReturns.find((r) => r.status === "draft");
  const lastFiled = mockVATReturns.find((r) => r.status === "filed");
  return {
    currentReturn,
    lastFiled,
    totalOutputVat: currentReturn?.outputVat ?? 0,
    totalInputVat: currentReturn?.inputVat ?? 0,
    netPayable: currentReturn?.netVat ?? 0,
  };
}
