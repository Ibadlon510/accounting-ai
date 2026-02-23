/**
 * Derives display status for invoices and bills from amountPaid, amountDue, and dueDate.
 * The stored status column is not automatically updated when payments are recorded,
 * so we derive the correct status at read time based on the source of truth (amounts).
 */
export function deriveInvoiceStatus(
  storedStatus: string,
  amountPaid: number,
  amountDue: number,
  dueDate: string | null
): string {
  if (storedStatus === "draft" || storedStatus === "cancelled") {
    return storedStatus;
  }
  if (amountDue <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate && dueDate < today) return "overdue";
  return "sent";
}

export function deriveBillStatus(
  storedStatus: string,
  amountPaid: number,
  amountDue: number,
  dueDate: string | null
): string {
  if (storedStatus === "draft" || storedStatus === "cancelled") {
    return storedStatus;
  }
  if (amountDue <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate && dueDate < today) return "overdue";
  return "received";
}
