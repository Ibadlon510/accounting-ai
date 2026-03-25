"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { Plus } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";

export type Product = {
  id: string;
  name: string;
  sku: string;
  type: string;
  salesPrice: number;
  purchasePrice: number;
  unitOfMeasure: string;
  salesAccountId?: string | null;
  purchaseAccountId?: string | null;
};

type CreateProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (product: Product) => void;
};

export function CreateProductModal({
  open,
  onOpenChange,
  onCreated,
}: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState<"product" | "service">("product");
  const [salesPrice, setSalesPrice] = useState<string>("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("pcs");
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setSku("");
    setType("product");
    setSalesPrice("");
    setUnitOfMeasure("pcs");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || undefined,
          type,
          unitOfMeasure,
          salesPrice: parseFloat(salesPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create product");
      }
      const item = data.item;
      if (item?.id && item?.name) {
        onCreated({
          id: item.id,
          name: item.name,
          sku: item.sku ?? "",
          type: item.type ?? "product",
          salesPrice: item.salesPrice ?? 0,
          purchasePrice: item.purchasePrice ?? item.salesPrice ?? 0,
          unitOfMeasure: unitOfMeasure,
        });
        showSuccess("Product added", `${item.name} has been added.`);
        reset();
        onOpenChange(false);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      showError(
        "Could not add product",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product-name" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
              Name *
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product or service name"
              className="mt-1.5 h-9 rounded-lg text-[13px]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-sku" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                SKU
              </Label>
              <Input
                id="product-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. PROD-001"
                className="mt-1.5 h-9 rounded-lg text-[13px] uppercase"
              />
            </div>
            <div>
              <Label htmlFor="product-type" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Type
              </Label>
              <StyledSelect
                id="product-type"
                value={type}
                onChange={(e) => setType(e.target.value as "product" | "service")}
                className="mt-1.5 h-9 rounded-lg text-[13px]"
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </StyledSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-price" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Sales Price (AED) *
              </Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 h-9 rounded-lg text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="product-unit" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Unit
              </Label>
              <StyledSelect
                id="product-unit"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="mt-1.5 h-9 rounded-lg text-[13px]"
              >
                <option value="pcs">Pieces</option>
                <option value="hrs">Hours</option>
                <option value="kg">Kilograms</option>
                <option value="box">Boxes</option>
                <option value="set">Sets</option>
              </StyledSelect>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false); }}
              className="rounded-xl text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-xl bg-success px-5 text-[13px] font-semibold text-white hover:bg-success/90"
            >
              {saving ? "Creating..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
