"use client";

import { useEffect, useState } from "react";
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
import { StyledSelect } from "@/components/ui/styled-select";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  Building2,
  Calendar,
  DollarSign,
  Hash,
  Info,
  Landmark,
  Layers,
} from "lucide-react";

export type FixedAssetRecord = {
  id: string;
  assetNumber: string;
  name: string;
  description: string | null;
  category: string;
  acquisitionDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  status: string;
  accumulatedDepreciation: number;
  bookValue: number;
  isActive: boolean;
};

type Account = { id: string; code: string; name: string };

interface AddFixedAssetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (asset: FixedAssetRecord) => void;
}

export function AddFixedAssetPanel({
  open,
  onOpenChange,
  onSaved,
}: AddFixedAssetPanelProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("equipment");
  const [acquisitionDate, setAcquisitionDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [cost, setCost] = useState("");
  const [salvageValue, setSalvageValue] = useState("0");
  const [usefulLifeMonths, setUsefulLifeMonths] = useState("36");
  const [description, setDescription] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/org/chart-of-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        const list = (d.accounts ?? []) as Account[];
        setAccounts(list);
        const bank =
          list.find((a) => a.code === "1110") ??
          list.find((a) => a.code === "1100") ??
          list.find((a) => a.code.startsWith("11")) ??
          list.find((a) => a.code === "2000");
        if (bank) setCreditAccountId(bank.id);
      })
      .catch(() => {});
  }, [open]);

  function reset() {
    setName("");
    setCategory("equipment");
    setAcquisitionDate(new Date().toISOString().slice(0, 10));
    setCost("");
    setSalvageValue("0");
    setUsefulLifeMonths("36");
    setDescription("");
  }

  async function handleSave() {
    if (!name.trim()) {
      showError("Name is required");
      return;
    }
    if (!creditAccountId) {
      showError("Select a credit account for capitalization");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fixed-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          acquisitionDate,
          cost: Number(cost),
          salvageValue: Number(salvageValue) || 0,
          usefulLifeMonths: Number(usefulLifeMonths),
          description: description.trim() || undefined,
          creditAccountId,
          capitalize: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create asset");
        return;
      }
      showSuccess("Asset registered", "Capitalization journal posted to the ledger.");
      onSaved(json.asset as FixedAssetRecord);
      reset();
      onOpenChange(false);
    } catch {
      showError("Failed to create asset");
    } finally {
      setSaving(false);
    }
  }

  const creditAccounts = accounts.filter(
    (a) => a.code.startsWith("1") || a.code.startsWith("2")
  );

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Register Fixed Asset" />
            <EntityPanelAvatar
              name={name || "New Asset"}
              fallbackGradient="from-slate-500 to-zinc-700"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Asset Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dell OptiPlex"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Layers className="h-4 w-4" />} label="Category">
                  <StyledSelect
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 shadow-none focus:ring-0"
                  >
                    <option value="furniture">Furniture & Fixtures (1510)</option>
                    <option value="equipment">Office Equipment (1520)</option>
                    <option value="vehicle">Vehicles (1530)</option>
                    <option value="computer">Computer Equipment (1540)</option>
                    <option value="other">PPE / Other (1500)</option>
                  </StyledSelect>
                </EntityPanelField>
                <EntityPanelField icon={<Calendar className="h-4 w-4" />} label="Acquisition Date">
                  <Input
                    type="date"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Cost">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Salvage Value">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelField icon={<Calendar className="h-4 w-4" />} label="Useful Life (months)">
                <Input
                  type="number"
                  min={1}
                  value={usefulLifeMonths}
                  onChange={(e) => setUsefulLifeMonths(e.target.value)}
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Landmark className="h-4 w-4" />} label="Credit Account">
                <StyledSelect
                  value={creditAccountId}
                  onChange={(e) => setCreditAccountId(e.target.value)}
                  className="h-8 border-0 bg-transparent p-0 shadow-none focus:ring-0"
                >
                  <option value="">Select bank or payable…</option>
                  {creditAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </StyledSelect>
              </EntityPanelField>
              <EntityPanelField icon={<Info className="h-4 w-4" />} label="Description">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
            </EntityPanelFieldGroup>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Ledger posting" />
            <EntityPanelSidebarSection title="Capitalization">
              <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
                Posts Dr asset account (1500–1540) / Cr bank or payable. Entries can only be
                reversed, not edited or deleted.
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Depreciation">
              <p className="text-[12px] text-text-secondary">
                Monthly straight-line: (cost − salvage) ÷ life. Runs post Dr 6700 / Cr 1600.
              </p>
            </EntityPanelSidebarSection>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Saving…" : "Register & post"}
          saveDisabled={saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
