import { db } from "@/lib/db";
import {
  items,
  inventoryMovements,
  invoiceLines,
  billLines,
  chartOfAccounts,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";

type DbClient = typeof db;
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type InventoryClient = DbClient | TxClient;

const COGS_ACCOUNT_CODE = "5000";
const DEFAULT_INVENTORY_ACCOUNT_CODE = "1300";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundQty(n: number): number {
  return Math.round(n * 10000) / 10000;
}

async function resolveAccountId(
  client: InventoryClient,
  organizationId: string,
  code: string
): Promise<string | null> {
  const [row] = await (client as DbClient)
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.organizationId, organizationId),
        eq(chartOfAccounts.code, code)
      )
    )
    .limit(1);
  return row?.id ?? null;
}

async function alreadyApplied(
  client: InventoryClient,
  organizationId: string,
  referenceType: "invoice" | "bill",
  referenceId: string
): Promise<boolean> {
  const [existing] = await (client as DbClient)
    .select({ id: inventoryMovements.id })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.organizationId, organizationId),
        eq(inventoryMovements.referenceType, referenceType),
        eq(inventoryMovements.referenceId, referenceId)
      )
    )
    .limit(1);
  return !!existing;
}

/**
 * On invoice confirm (sale): for each stock line, decrement qty, insert sale
 * movement, and post COGS JE (Dr 5000 / Cr Inventory) at weighted-average cost.
 *
 * Edge cases (MVP):
 * - Non-stock / service / missing itemId / trackInventory=false → skipped
 * - Missing or zero cost → still decrement qty + record movement; skip COGS JE (logged)
 * - Insufficient qty → allow negative on-hand (logged warning); do not reject post
 */
export async function applyInvoiceStockOut(params: {
  organizationId: string;
  invoiceId: string;
  invoiceNumber: string;
  entryDate: string;
  currency?: string;
  tx?: InventoryClient;
}): Promise<{ movements: number; cogsJournalEntryIds: string[] }> {
  const client = (params.tx ?? db) as DbClient;
  const { organizationId, invoiceId, invoiceNumber, entryDate } = params;
  const currency = params.currency ?? "AED";

  if (await alreadyApplied(client, organizationId, "invoice", invoiceId)) {
    console.warn(
      `[inventory] Skipping invoice ${invoiceNumber}: stock movements already applied`
    );
    return { movements: 0, cogsJournalEntryIds: [] };
  }

  const lines = await client
    .select({
      itemId: invoiceLines.itemId,
      description: invoiceLines.description,
      quantity: invoiceLines.quantity,
    })
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId));

  const cogsAccountId = await resolveAccountId(
    client,
    organizationId,
    COGS_ACCOUNT_CODE
  );
  const defaultInventoryAccountId = await resolveAccountId(
    client,
    organizationId,
    DEFAULT_INVENTORY_ACCOUNT_CODE
  );

  let movements = 0;
  const cogsJournalEntryIds: string[] = [];

  for (const line of lines) {
    if (!line.itemId) continue;
    const qty = parseFloat(line.quantity ?? "0");
    if (!(qty > 0)) continue;

    const [item] = await client
      .select({
        id: items.id,
        name: items.name,
        type: items.type,
        trackInventory: items.trackInventory,
        costPrice: items.costPrice,
        quantityOnHand: items.quantityOnHand,
        inventoryAccountId: items.inventoryAccountId,
      })
      .from(items)
      .where(
        and(eq(items.id, line.itemId), eq(items.organizationId, organizationId))
      )
      .limit(1);

    if (!item) {
      console.warn(
        `[inventory] Invoice ${invoiceNumber}: item ${line.itemId} not found — skipping line`
      );
      continue;
    }
    if (item.type === "service" || !item.trackInventory) continue;

    const unitCost = parseFloat(item.costPrice ?? "0");
    const onHand = parseFloat(item.quantityOnHand ?? "0");
    const newQty = roundQty(onHand - qty);
    const totalCost = roundMoney(Math.abs(qty) * Math.max(unitCost, 0));

    if (newQty < 0) {
      console.warn(
        `[inventory] Invoice ${invoiceNumber}: insufficient qty for "${item.name}" ` +
          `(on hand ${onHand}, sold ${qty}) — allowing negative stock (MVP)`
      );
    }

    await client.insert(inventoryMovements).values({
      organizationId,
      itemId: item.id,
      movementType: "sale",
      quantity: String(-qty),
      unitCost: String(roundMoney(Math.max(unitCost, 0))),
      totalCost: String(totalCost),
      referenceType: "invoice",
      referenceId: invoiceId,
      notes: `Sale — ${invoiceNumber}`,
    });

    await client
      .update(items)
      .set({
        quantityOnHand: String(newQty),
        updatedAt: new Date(),
      })
      .where(eq(items.id, item.id));

    movements += 1;

    if (!(unitCost > 0) || !(totalCost > 0)) {
      console.warn(
        `[inventory] Invoice ${invoiceNumber}: missing/zero cost for "${item.name}" ` +
          `(costPrice=${item.costPrice}) — stock decremented, COGS JE skipped`
      );
      continue;
    }

    const inventoryAccountId =
      item.inventoryAccountId || defaultInventoryAccountId;
    if (!cogsAccountId || !inventoryAccountId) {
      console.warn(
        `[inventory] Invoice ${invoiceNumber}: COGS (5000) or Inventory (1300) account missing — ` +
          `stock decremented, COGS JE skipped for "${item.name}"`
      );
      continue;
    }

    const { journalEntryId } = await postJournalEntry({
      organizationId,
      entryDate,
      description: `COGS — ${invoiceNumber} — ${item.name}`,
      reference: invoiceId,
      sourceType: "cogs",
      sourceId: invoiceId,
      currency,
      lines: [
        {
          accountId: cogsAccountId,
          description: `COGS — ${item.name}`,
          debit: totalCost,
          credit: 0,
        },
        {
          accountId: inventoryAccountId,
          description: `Inventory out — ${item.name}`,
          debit: 0,
          credit: totalCost,
        },
      ],
      tx: client,
    });
    cogsJournalEntryIds.push(journalEntryId);
  }

  return { movements, cogsJournalEntryIds };
}

/**
 * Resolve the GL account to debit for a bill line.
 * Stock-tracked products → inventory asset (item.inventoryAccountId or 1300).
 * Services / non-tracked → caller-supplied expense account.
 */
export async function resolveBillLineDebitAccount(params: {
  organizationId: string;
  itemId: string | null | undefined;
  fallbackExpenseAccountId: string | null | undefined;
  tx?: InventoryClient;
}): Promise<{ accountId: string | null; isStock: boolean; itemName?: string }> {
  const client = (params.tx ?? db) as DbClient;
  if (!params.itemId) {
    return { accountId: params.fallbackExpenseAccountId ?? null, isStock: false };
  }

  const [item] = await client
    .select({
      name: items.name,
      type: items.type,
      trackInventory: items.trackInventory,
      inventoryAccountId: items.inventoryAccountId,
    })
    .from(items)
    .where(
      and(
        eq(items.id, params.itemId),
        eq(items.organizationId, params.organizationId)
      )
    )
    .limit(1);

  if (!item || item.type === "service" || !item.trackInventory) {
    return {
      accountId: params.fallbackExpenseAccountId ?? null,
      isStock: false,
      itemName: item?.name,
    };
  }

  let inventoryAccountId = item.inventoryAccountId;
  if (!inventoryAccountId) {
    inventoryAccountId = await resolveAccountId(
      client,
      params.organizationId,
      DEFAULT_INVENTORY_ACCOUNT_CODE
    );
  }

  return {
    accountId: inventoryAccountId ?? params.fallbackExpenseAccountId ?? null,
    isStock: true,
    itemName: item.name,
  };
}

/**
 * On bill confirm (purchase): for each stock line, increment qty, insert
 * purchase movement, and update weighted-average costPrice.
 *
 * Edge cases (MVP):
 * - Non-stock / service / missing itemId / trackInventory=false → skipped
 * - If on-hand ≤ 0 before purchase, new costPrice = purchase unit price
 * - Idempotent via referenceType/referenceId
 */
export async function applyBillStockIn(params: {
  organizationId: string;
  billId: string;
  billNumber: string;
  tx?: InventoryClient;
}): Promise<{ movements: number }> {
  const client = (params.tx ?? db) as DbClient;
  const { organizationId, billId, billNumber } = params;

  if (await alreadyApplied(client, organizationId, "bill", billId)) {
    console.warn(
      `[inventory] Skipping bill ${billNumber}: stock movements already applied`
    );
    return { movements: 0 };
  }

  const lines = await client
    .select({
      itemId: billLines.itemId,
      description: billLines.description,
      quantity: billLines.quantity,
      unitPrice: billLines.unitPrice,
    })
    .from(billLines)
    .where(eq(billLines.billId, billId));

  let movements = 0;

  for (const line of lines) {
    if (!line.itemId) continue;
    const qty = parseFloat(line.quantity ?? "0");
    if (!(qty > 0)) continue;

    const unitPrice = parseFloat(line.unitPrice ?? "0");
    const [item] = await client
      .select({
        id: items.id,
        name: items.name,
        type: items.type,
        trackInventory: items.trackInventory,
        costPrice: items.costPrice,
        quantityOnHand: items.quantityOnHand,
      })
      .from(items)
      .where(
        and(eq(items.id, line.itemId), eq(items.organizationId, organizationId))
      )
      .limit(1);

    if (!item) {
      console.warn(
        `[inventory] Bill ${billNumber}: item ${line.itemId} not found — skipping line`
      );
      continue;
    }
    if (item.type === "service" || !item.trackInventory) continue;

    const onHand = parseFloat(item.quantityOnHand ?? "0");
    const oldCost = parseFloat(item.costPrice ?? "0");
    const purchaseUnitCost = unitPrice >= 0 ? unitPrice : 0;
    const newQty = roundQty(onHand + qty);

    let newCost: number;
    if (onHand > 0 && newQty > 0) {
      newCost = roundMoney(
        (onHand * Math.max(oldCost, 0) + qty * purchaseUnitCost) / newQty
      );
    } else {
      // Negative or zero prior qty: reset average to this purchase's unit cost
      newCost = roundMoney(purchaseUnitCost);
    }

    const totalCost = roundMoney(qty * purchaseUnitCost);

    await client.insert(inventoryMovements).values({
      organizationId,
      itemId: item.id,
      movementType: "purchase",
      quantity: String(qty),
      unitCost: String(roundMoney(purchaseUnitCost)),
      totalCost: String(totalCost),
      referenceType: "bill",
      referenceId: billId,
      notes: `Purchase — ${billNumber}`,
    });

    await client
      .update(items)
      .set({
        quantityOnHand: String(newQty),
        costPrice: String(newCost),
        purchasePrice: String(roundMoney(purchaseUnitCost)),
        updatedAt: new Date(),
      })
      .where(eq(items.id, item.id));

    movements += 1;
  }

  return { movements };
}

export { COGS_ACCOUNT_CODE, DEFAULT_INVENTORY_ACCOUNT_CODE };
