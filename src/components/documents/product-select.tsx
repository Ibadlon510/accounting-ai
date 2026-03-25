"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddItemPanel } from "@/components/modals/add-item-panel";
import type { Product } from "./create-product-modal";

export type { Product };

type ProductSelectProps = {
  value: string;
  onChange: (productId: string, product: Product | null) => void;
  placeholder?: string;
  className?: string;
};

export function ProductSelect({
  value,
  onChange,
  placeholder = "Select product or service",
  className,
}: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function loadProducts() {
    setLoading(true);
    fetch("/api/inventory", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        const items = (d.items ?? []).filter(
          (i: Product & { isActive?: boolean }) => (i.type === "product" || i.type === "service") && i.isActive !== false
        );
        setProducts(
          items.map((i: Product & { unitOfMeasure?: string; isActive?: boolean }) => ({
            id: i.id,
            name: i.name,
            sku: i.sku ?? "",
            type: i.type,
            salesPrice: i.salesPrice ?? 0,
            purchasePrice: i.purchasePrice ?? 0,
            unitOfMeasure: i.unitOfMeasure ?? "pcs",
            salesAccountId: i.salesAccountId ?? null,
            purchaseAccountId: i.purchaseAccountId ?? null,
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const selected = products.find((p) => p.id === value);
  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const label = p.sku ? `${p.name} (${p.sku})` : p.name;
    return label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setDropdownRect(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getLabel(p: Product) {
    return p.sku ? `${p.name} (${p.sku})` : p.name;
  }

  return (
    <>
      <div ref={containerRef} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              setSearch("");
              const el = containerRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
              } else {
                setDropdownRect(null);
              }
              setTimeout(() => inputRef.current?.focus(), 50);
            } else {
              setDropdownRect(null);
            }
          }}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-border-subtle bg-surface px-3 text-left text-[13px] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/30",
            "hover:border-border-subtle/80",
            !selected && "text-text-meta"
          )}
        >
          <span className="truncate">
            {loading ? "Loading..." : selected ? getLabel(selected) : placeholder}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-text-meta" />
        </button>

        {open && !loading && dropdownRect && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed rounded-xl border border-border-subtle bg-surface shadow-lg"
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
            >
              <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-text-meta" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-meta min-w-0"
                />
              </div>

              <div className="max-h-[200px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-center text-[12px] text-text-meta">
                    {search ? "No matches" : "No products"}
                  </p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onChange(p.id, p);
                        setOpen(false);
                        setSearch("");
                        setDropdownRect(null);
                      }}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]",
                        p.id === value && "bg-text-primary/5 font-medium"
                      )}
                    >
                      {getLabel(p)}
                    </button>
                  ))
                )}
                <div className="my-1 border-t border-border-subtle" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDropdownRect(null);
                    setCreateOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-success hover:bg-success/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create product
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>

      <AddItemPanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (data) => {
          const res = await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.name,
              sku: data.sku,
              type: data.type,
              unitOfMeasure: data.unitOfMeasure,
              salesPrice: data.salesPrice,
              purchasePrice: data.purchasePrice,
              quantityOnHand: data.quantityOnHand,
              reorderLevel: data.reorderLevel,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            const { showError } = await import("@/lib/utils/toast-helpers");
            showError(json.error ?? "Failed to create item");
            throw new Error(json.error ?? "Failed to create item");
          }
          const item = json.item as { id: string; name: string; sku: string; type: string; unitOfMeasure: string; salesPrice: number; purchasePrice: number };
          const product: Product = {
            id: item.id,
            name: item.name,
            sku: item.sku ?? "",
            type: item.type,
            salesPrice: typeof item.salesPrice === "number" ? item.salesPrice : parseFloat(item.salesPrice ?? "0") || 0,
            purchasePrice: typeof item.purchasePrice === "number" ? item.purchasePrice : parseFloat(item.purchasePrice ?? "0") || 0,
            unitOfMeasure: item.unitOfMeasure ?? "pcs",
          };
          setProducts((prev) => {
            if (prev.some((x) => x.id === product.id)) return prev;
            return [product, ...prev];
          });
          onChange(product.id, product);
        }}
      />
    </>
  );
}

/** Get display label for a product */
export function getProductLabel(product: Product | null): string {
  if (!product) return "";
  return product.sku ? `${product.name} (${product.sku})` : product.name;
}

/** Get price from product based on context */
export function getProductPrice(product: Product | null, field: "sales" | "purchase"): number {
  if (!product) return 0;
  return field === "sales" ? product.salesPrice : product.purchasePrice;
}
