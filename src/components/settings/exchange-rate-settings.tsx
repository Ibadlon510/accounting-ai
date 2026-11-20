"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { Loader2, Plus, Trash2 } from "lucide-react";

type CurrencyOption = { code: string; name: string; symbol: string };

type ExchangeRateRow = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
};

export function ExchangeRateSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("AED");
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    fromCurrency: "USD",
    rate: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/org/exchange-rates", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Failed to load rates", data.error ?? "Could not load exchange rates.");
        return;
      }
      const data = await res.json();
      setBaseCurrency(data.baseCurrency ?? "AED");
      setCurrencies(data.currencies ?? []);
      setRates(data.rates ?? []);
      setForm((f) => ({
        ...f,
        fromCurrency:
          (data.currencies ?? []).find((c: CurrencyOption) => c.code !== (data.baseCurrency ?? "AED"))
            ?.code ?? "USD",
      }));
    } catch {
      showError("Failed to load rates", "Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    const rate = parseFloat(form.rate);
    if (!form.fromCurrency || !form.effectiveDate || !Number.isFinite(rate) || rate <= 0) {
      showError("Validation", "Enter a foreign currency, positive rate, and effective date.");
      return;
    }
    if (form.fromCurrency === baseCurrency) {
      showError("Validation", "Choose a currency different from the org base currency.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/org/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: form.fromCurrency,
          toCurrency: baseCurrency,
          rate,
          effectiveDate: form.effectiveDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Save failed", data.error ?? "Could not save exchange rate.");
        return;
      }
      showSuccess("Rate saved", `${form.fromCurrency} → ${baseCurrency} updated.`);
      setForm((f) => ({ ...f, rate: "" }));
      setAdding(false);
      await load();
    } catch {
      showError("Error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/org/exchange-rates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Delete failed", data.error ?? "Could not delete rate.");
        return;
      }
      showSuccess("Rate deleted", "Exchange rate removed.");
      await load();
    } catch {
      showError("Error", "Network error.");
    }
  }

  const foreignOptions = currencies.filter((c) => c.code !== baseCurrency);

  if (loading) {
    return (
      <div className="dashboard-card flex items-center justify-center gap-2 py-10 text-[13px] text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading exchange rates…
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">Exchange Rates</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Rates convert foreign document currency into your base currency ({baseCurrency}).
            Use 1 foreign unit = rate {baseCurrency} (e.g. 1 USD = 3.67 AED).
          </p>
        </div>
        <Button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="h-9 gap-1.5 rounded-xl bg-text-primary px-4 text-[12px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Rate
        </Button>
      </div>

      {adding && (
        <div className="mt-6 rounded-xl border border-border-subtle p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                From currency
              </label>
              <StyledSelect
                value={form.fromCurrency}
                onChange={(e) => setForm((f) => ({ ...f, fromCurrency: e.target.value }))}
                className="h-10 text-[13px]"
              >
                {foreignOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </StyledSelect>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Rate (→ {baseCurrency})
              </label>
              <Input
                type="number"
                step="0.00000001"
                min="0"
                value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                placeholder="e.g. 3.6725"
                className="h-10 rounded-xl border-border-subtle text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Effective date
              </label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                className="h-10 rounded-xl border-border-subtle text-[13px]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAdding(false)}
              className="h-9 rounded-xl text-[12px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-9 rounded-xl bg-text-primary px-4 text-[12px] font-semibold text-white hover:bg-text-primary/90"
            >
              {saving ? "Saving…" : "Save Rate"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {rates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-secondary">
            No exchange rates yet. Add a rate before creating invoices, bills, or journals in a
            foreign currency.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-secondary">
                <th className="pb-2 font-medium">From</th>
                <th className="pb-2 font-medium">To</th>
                <th className="pb-2 font-medium">Rate</th>
                <th className="pb-2 font-medium">Effective</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle/50">
                  <td className="py-2.5 font-medium text-text-primary">{r.fromCurrency}</td>
                  <td className="py-2.5 text-text-primary">{r.toCurrency}</td>
                  <td className="py-2.5 font-mono text-text-primary">{r.rate}</td>
                  <td className="py-2.5 text-text-secondary">{r.effectiveDate}</td>
                  <td className="py-2.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-error hover:bg-error/10"
                      aria-label={`Delete ${r.fromCurrency} rate`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
