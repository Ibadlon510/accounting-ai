"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProductModal, type Product } from "./create-product-modal";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        const items = (d.items ?? []).filter(
          (i: Product & { isActive?: boolean }) => (i.type === "product" || i.type === "service") && i.isActive !== false
        );
        setProducts(
          items.map((i: Product & { unitOfMeasure?: string }) => ({
            id: i.id,
            name: i.name,
            sku: i.sku ?? "",
            type: i.type,
            salesPrice: i.salesPrice ?? 0,
            purchasePrice: i.purchasePrice ?? 0,
            unitOfMeasure: i.unitOfMeasure ?? "pcs",
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [createOpen]);

  const selected = products.find((p) => p.id === value);
  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const label = p.sku ? `${p.name} (${p.sku})` : p.name;
    return label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
            setOpen(!open);
            if (!open) {
              setSearch("");
              setTimeout(() => inputRef.current?.focus(), 50);
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

        {open && !loading && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border-subtle bg-surface shadow-lg">
            <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-meta" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-meta"
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
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-success hover:bg-success/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add new product
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProductModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(product) => {
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
