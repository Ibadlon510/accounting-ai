"use client";

import { useEffect, useMemo, useState } from "react";
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
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";
import { Calendar, DollarSign, Hash, Info, Landmark } from "lucide-react";
import { formatNumber } from "@/lib/accounting/engine";
import type { EmployeeRecord } from "./employee-panel";

interface PostSalaryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRecord | null;
  onPosted?: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function PostSalaryPanel({ open, onOpenChange, employee, onPosted }: PostSalaryPanelProps) {
  const [entryDate, setEntryDate] = useState(todayISO());
  const [basicSalary, setBasicSalary] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [payFrom, setPayFrom] = useState<"cash" | "payable">("cash");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    setEntryDate(todayISO());
    setBasicSalary(employee.basicSalary ? String(employee.basicSalary) : "");
    setHousingAllowance(employee.housingAllowance ? String(employee.housingAllowance) : "");
    setTransportAllowance(employee.transportAllowance ? String(employee.transportAllowance) : "");
    setPayFrom("cash");
    setReference("");
  }, [open, employee]);

  const total = useMemo(() => {
    return (Number(basicSalary) || 0) + (Number(housingAllowance) || 0) + (Number(transportAllowance) || 0);
  }, [basicSalary, housingAllowance, transportAllowance]);

  async function handleSave() {
    if (!employee) return;
    if (total <= 0) {
      showError("Salary amount must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/employees/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          entryDate,
          basicSalary: Number(basicSalary) || 0,
          housingAllowance: Number(housingAllowance) || 0,
          transportAllowance: Number(transportAllowance) || 0,
          payFrom,
          reference: reference.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Failed to post salary", json.error ?? "Please try again.");
        return;
      }
      const entryNumber = json.entry?.entryNumber ?? "journal entry";
      showSuccess(
        "Salary posted",
        `${entryNumber} — Dr expense / Cr ${payFrom === "payable" ? "2110 Accrued Salaries" : "1110 Bank"} (AED ${formatNumber(total)}).`
      );
      onPosted?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Post Salary Journal" showAiButton={false} />
            <EntityPanelAvatar
              name={employee.name}
              fallbackGradient="from-emerald-400 to-teal-600"
            />

            <EntityPanelFieldGroup>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Calendar className="h-4 w-4" />} label="Entry Date">
                  <Input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Landmark className="h-4 w-4" />} label="Credit Account">
                  <StyledSelect
                    value={payFrom}
                    onChange={(e) => setPayFrom(e.target.value as "cash" | "payable")}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary"
                  >
                    <option value="cash">1110 Main Bank (cash paid)</option>
                    <option value="payable">2110 Accrued Salaries (payable)</option>
                  </StyledSelect>
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Basic (6010)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Housing (6020)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={housingAllowance}
                    onChange={(e) => setHousingAllowance(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Transport (6030)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transportAllowance}
                    onChange={(e) => setTransportAllowance(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Reference">
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional reference"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Journal preview" />
            <EntityPanelSidebarSection>
              <p className="text-[12px] text-text-meta mb-2">Total debit / credit</p>
              <p className="text-[22px] font-bold tabular-nums text-text-primary">
                AED {formatNumber(total)}
              </p>
              <ul className="mt-3 space-y-1 text-[12px] text-text-secondary">
                {(Number(basicSalary) || 0) > 0 && <li>Dr 6010 Basic Salaries</li>}
                {(Number(housingAllowance) || 0) > 0 && <li>Dr 6020 Housing Allowance</li>}
                {(Number(transportAllowance) || 0) > 0 && <li>Dr 6030 Transport Allowance</li>}
                <li>
                  Cr {payFrom === "payable" ? "2110 Accrued Salaries" : "1110 Main Bank Account"}
                </li>
              </ul>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-4 w-4" />}>
              Single-employee salary JE. Prefer Pay runs for period payroll and WPS export.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>
        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Posting…" : "Post journal"}
          saveDisabled={saving || total <= 0}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
