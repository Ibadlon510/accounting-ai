"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PlaceholderDef {
  key: string;
  label: string;
  category: string;
  description: string;
  sampleValue: string;
  type: string;
}

interface PlaceholderCategory {
  id: string;
  label: string;
  placeholders: PlaceholderDef[];
}

interface PlaceholderHelper {
  syntax: string;
  description: string;
}

interface PlaceholderReferenceProps {
  documentType?: string;
  onInsert?: (key: string) => void;
}

export function PlaceholderReference({ documentType, onInsert }: PlaceholderReferenceProps) {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<PlaceholderCategory[]>([]);
  const [helpers, setHelpers] = useState<PlaceholderHelper[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = documentType
      ? `/api/pdf/placeholders?documentType=${documentType}`
      : "/api/pdf/placeholders";

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => {
        setCategories(data.categories ?? []);
        setHelpers(data.helpers ?? []);
        setExpandedCats(new Set((data.categories ?? []).map((c: PlaceholderCategory) => c.id)));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [documentType]);

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        placeholders: cat.placeholders.filter(
          (p) =>
            p.key.toLowerCase().includes(q) ||
            p.label.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.placeholders.length > 0);
  }, [categories, search]);

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    toast.success(`Copied {{${key}}}`);
  };

  if (loading) {
    return <div className="p-4 text-center text-[12px] text-text-meta">Loading placeholders…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-meta" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search placeholders…"
            className="h-8 pl-8 text-[12px]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filtered.map((cat) => (
            <div key={cat.id} className="mb-1">
              <button
                onClick={() => toggleCat(cat.id)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta hover:bg-black/5"
              >
                {expandedCats.has(cat.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {cat.label}
                <span className="ml-auto font-normal">{cat.placeholders.length}</span>
              </button>

              {expandedCats.has(cat.id) && (
                <div className="ml-1 space-y-0.5">
                  {cat.placeholders.map((p) => (
                    <div
                      key={p.key}
                      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-black/[0.03]"
                    >
                      <div className="min-w-0 flex-1">
                        <code className="text-[11px] font-semibold text-text-primary">
                          {`{{${p.key}}}`}
                        </code>
                        <div className="text-[11px] text-text-meta">{p.description}</div>
                        <div className="mt-0.5 text-[10px] italic text-text-meta/60">
                          e.g. {p.sampleValue}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(p.key)}
                          title="Copy placeholder"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {onInsert && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onInsert(`{{${p.key}}}`)}
                            title="Insert at cursor"
                          >
                            <span className="text-[10px] font-bold">+</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {helpers.length > 0 && (
            <div className="mt-3 border-t border-border-subtle pt-3">
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Helpers & Syntax
              </div>
              <div className="mt-1 space-y-1">
                {helpers.map((h) => (
                  <div key={h.syntax} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-black/[0.03]">
                    <div className="min-w-0 flex-1">
                      <code className="text-[11px] font-semibold text-text-primary">{h.syntax}</code>
                      <div className="text-[11px] text-text-meta">{h.description}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(h.syntax);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
