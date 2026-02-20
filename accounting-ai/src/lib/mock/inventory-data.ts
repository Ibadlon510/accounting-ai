export interface Item {
  id: string;
  name: string;
  sku: string;
  type: "product" | "service";
  unitOfMeasure: string;
  salesPrice: number;
  purchasePrice: number;
  costPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  totalValue: number;
  isActive: boolean;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: "purchase" | "sale" | "adjustment" | "transfer";
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  reference: string;
}

export const mockItems: Item[] = [
  { id: "item-001", name: "Dell Monitor 27\" 4K", sku: "MON-D27-4K", type: "product", unitOfMeasure: "pcs", salesPrice: 1800, purchasePrice: 1200, costPrice: 1200, quantityOnHand: 15, reorderLevel: 5, totalValue: 18000, isActive: true },
  { id: "item-002", name: "Logitech MX Keys Keyboard", sku: "KB-LG-MXK", type: "product", unitOfMeasure: "pcs", salesPrice: 550, purchasePrice: 350, costPrice: 350, quantityOnHand: 25, reorderLevel: 10, totalValue: 8750, isActive: true },
  { id: "item-003", name: "Cat6 Network Cable (305m)", sku: "CBL-CAT6-305", type: "product", unitOfMeasure: "box", salesPrice: 450, purchasePrice: 280, costPrice: 280, quantityOnHand: 8, reorderLevel: 3, totalValue: 2240, isActive: true },
  { id: "item-004", name: "HP LaserJet Pro Printer", sku: "PRN-HP-LJ", type: "product", unitOfMeasure: "pcs", salesPrice: 2200, purchasePrice: 1500, costPrice: 1500, quantityOnHand: 3, reorderLevel: 2, totalValue: 4500, isActive: true },
  { id: "item-005", name: "A4 Copy Paper (Ream)", sku: "PPR-A4-500", type: "product", unitOfMeasure: "ream", salesPrice: 30, purchasePrice: 22, costPrice: 22, quantityOnHand: 200, reorderLevel: 50, totalValue: 4400, isActive: true },
  { id: "item-006", name: "IT Consulting (Hourly)", sku: "SVC-IT-HR", type: "service", unitOfMeasure: "hour", salesPrice: 500, purchasePrice: 0, costPrice: 0, quantityOnHand: 0, reorderLevel: 0, totalValue: 0, isActive: true },
  { id: "item-007", name: "System Audit Package", sku: "SVC-AUDIT", type: "service", unitOfMeasure: "unit", salesPrice: 15000, purchasePrice: 0, costPrice: 0, quantityOnHand: 0, reorderLevel: 0, totalValue: 0, isActive: true },
  { id: "item-008", name: "Wireless Mouse", sku: "MSE-WL-01", type: "product", unitOfMeasure: "pcs", salesPrice: 180, purchasePrice: 95, costPrice: 95, quantityOnHand: 2, reorderLevel: 10, totalValue: 190, isActive: true },
];

export const mockMovements: InventoryMovement[] = [
  { id: "mov-001", itemId: "item-001", itemName: "Dell Monitor 27\" 4K", movementType: "purchase", quantity: 20, unitCost: 1200, totalCost: 24000, date: "2026-01-05", reference: "PO-001" },
  { id: "mov-002", itemId: "item-001", itemName: "Dell Monitor 27\" 4K", movementType: "sale", quantity: -5, unitCost: 1200, totalCost: 6000, date: "2026-01-20", reference: "INV-2026-006" },
  { id: "mov-003", itemId: "item-002", itemName: "Logitech MX Keys Keyboard", movementType: "purchase", quantity: 30, unitCost: 350, totalCost: 10500, date: "2026-01-08", reference: "PO-002" },
  { id: "mov-004", itemId: "item-002", itemName: "Logitech MX Keys Keyboard", movementType: "sale", quantity: -5, unitCost: 350, totalCost: 1750, date: "2026-01-25", reference: "INV-2026-007" },
  { id: "mov-005", itemId: "item-005", itemName: "A4 Copy Paper (Ream)", movementType: "purchase", quantity: 250, unitCost: 22, totalCost: 5500, date: "2026-01-10", reference: "PO-003" },
  { id: "mov-006", itemId: "item-005", itemName: "A4 Copy Paper (Ream)", movementType: "adjustment", quantity: -50, unitCost: 22, totalCost: 1100, date: "2026-01-31", reference: "ADJ-001" },
  { id: "mov-007", itemId: "item-008", itemName: "Wireless Mouse", movementType: "purchase", quantity: 12, unitCost: 95, totalCost: 1140, date: "2026-01-12", reference: "PO-004" },
  { id: "mov-008", itemId: "item-008", itemName: "Wireless Mouse", movementType: "sale", quantity: -10, unitCost: 95, totalCost: 950, date: "2026-02-01", reference: "INV-2026-008" },
];

export function getInventoryStats() {
  const products = mockItems.filter(i => i.type === "product");
  const totalValue = products.reduce((s, i) => s + i.totalValue, 0);
  const lowStock = products.filter(i => i.quantityOnHand <= i.reorderLevel).length;
  return { totalItems: mockItems.length, totalProducts: products.length, totalValue, lowStock };
}
