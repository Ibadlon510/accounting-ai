"use client";

import { useState } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelFieldRow,
  EntityPanelField,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { Package, Tag, DollarSign, Boxes, Info } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";
import type { Item } from "@/lib/mock/inventory-data";

interface AddItemPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (item: Omit<Item, "id" | "totalValue">) => void;
}

export function AddItemPanel({ open, onOpenChange, onCreate }: AddItemPanelProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState<"product" | "service">("product");
  const [unit, setUnit] = useState("pcs");
  const [salesPrice, setSalesPrice] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">(0);
  const [reorderLevel, setReorderLevel] = useState<number | "">(5);
  const [trackInventory, setTrackInventory] = useState(true);

  function reset() {
    setName(""); setSku(""); setType("product"); setUnit("pcs");
    setSalesPrice(""); setPurchasePrice(""); setQuantity(0); setReorderLevel(5);
    setTrackInventory(true);
  }

  function handleSave() {
    if (!name.trim()) { showError("Item name is required"); return; }
    if (!sku.trim()) { showError("SKU is required"); return; }

    const sp = Number(salesPrice) || 0;
    const pp = Number(purchasePrice) || 0;
    const qty = Number(quantity) || 0;
    const rl = Number(reorderLevel) || 0;

    onCreate({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      type,
      unitOfMeasure: unit,
      salesPrice: sp,
      purchasePrice: pp,
      costPrice: pp,
      quantityOnHand: qty,
      reorderLevel: rl,
      isActive: true,
    });
    showSuccess("Item created", `${name.trim()} (${sku.trim().toUpperCase()}) has been added to inventory.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader
              title="Add Inventory Item"
              onAiClick={() => showSuccess("AI Auto-fill", "Paste a product URL or barcode to auto-fill item details with AI.")}
            />
            <EntityPanelAvatar name={name || "New Item"} fallbackGradient="from-teal-400 to-cyan-500" />

            <EntityPanelFieldGroup>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Package className="h-4 w-4" />} label="Item Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dell Monitor 27&quot;" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0" />
                </EntityPanelField>
                <EntityPanelField icon={<Tag className="h-4 w-4" />} label="SKU">
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. MON-D27" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0 uppercase" />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Boxes className="h-4 w-4" />} label="Type">
                  <StyledSelect value={type} onChange={(e) => setType(e.target.value as "product" | "service")} className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary">
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </StyledSelect>
                </EntityPanelField>
                <EntityPanelField icon={<Package className="h-4 w-4" />} label="Unit">
                  <StyledSelect value={unit} onChange={(e) => setUnit(e.target.value)} className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary">
                    <option value="pcs">Pieces</option>
                    <option value="hrs">Hours</option>
                    <option value="kg">Kilograms</option>
                    <option value="box">Boxes</option>
                    <option value="set">Sets</option>
                  </StyledSelect>
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Sales Price (AED)">
                  <Input type="number" min="0" step="0.01" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium font-mono text-text-primary shadow-none focus-visible:ring-0" />
                </EntityPanelField>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Purchase Price (AED)">
                  <Input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium font-mono text-text-primary shadow-none focus-visible:ring-0" />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Boxes className="h-4 w-4" />} label="Opening Stock">
                  <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")} placeholder="0" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium font-mono text-text-primary shadow-none focus-visible:ring-0" />
                </EntityPanelField>
                <EntityPanelField icon={<Boxes className="h-4 w-4" />} label="Reorder Level">
                  <Input type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value ? Number(e.target.value) : "")} placeholder="5" className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium font-mono text-text-primary shadow-none focus-visible:ring-0" />
                </EntityPanelField>
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Inventory Settings" />
            <EntityPanelSidebarSection title="Tracking">
              <div className="flex items-start gap-2">
                <Checkbox id="track-inv" checked={trackInventory} onCheckedChange={(v) => setTrackInventory(!!v)} className="mt-0.5" />
                <Label htmlFor="track-inv" className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer">
                  Track inventory quantity
                </Label>
              </div>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Costing Method">
              <p className="text-[14px] font-medium text-text-primary">Weighted Average</p>
              <p className="mt-1 text-[11px] text-text-meta">Default for all inventory items</p>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Tax">
              <p className="text-[14px] font-medium text-text-primary">Standard Rate — 5% VAT</p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              COGS journal entries will be posted automatically on sale
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Create Item"
          saveDisabled={!name.trim() || !sku.trim()}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
