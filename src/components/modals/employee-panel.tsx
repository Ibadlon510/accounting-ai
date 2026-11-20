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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import {
  User,
  Hash,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Info,
  CreditCard,
  Landmark,
} from "lucide-react";

export type EmployeeRecord = {
  id: string;
  employeeNumber: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  joinDate: string | null;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  labourCardNumber: string | null;
  iban: string | null;
  bankRoutingCode: string | null;
  isActive: boolean;
};

interface EmployeePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeRecord | null;
  onSaved: (employee: EmployeeRecord) => void;
}

export function EmployeePanel({ open, onOpenChange, employee, onSaved }: EmployeePanelProps) {
  const isEdit = !!employee;
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [labourCardNumber, setLabourCardNumber] = useState("");
  const [iban, setIban] = useState("");
  const [bankRoutingCode, setBankRoutingCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (employee) {
      setName(employee.name ?? "");
      setEmployeeNumber(employee.employeeNumber ?? "");
      setEmail(employee.email ?? "");
      setPhone(employee.phone ?? "");
      setPosition(employee.position ?? "");
      setDepartment(employee.department ?? "");
      setJoinDate(employee.joinDate ?? "");
      setBasicSalary(employee.basicSalary ? String(employee.basicSalary) : "");
      setHousingAllowance(employee.housingAllowance ? String(employee.housingAllowance) : "");
      setTransportAllowance(employee.transportAllowance ? String(employee.transportAllowance) : "");
      setLabourCardNumber(employee.labourCardNumber ?? "");
      setIban(employee.iban ?? "");
      setBankRoutingCode(employee.bankRoutingCode ?? "");
      setIsActive(employee.isActive);
    } else {
      setName("");
      setEmployeeNumber("");
      setEmail("");
      setPhone("");
      setPosition("");
      setDepartment("");
      setJoinDate("");
      setBasicSalary("");
      setHousingAllowance("");
      setTransportAllowance("");
      setLabourCardNumber("");
      setIban("");
      setBankRoutingCode("");
      setIsActive(true);
    }
  }, [open, employee]);

  async function handleSave() {
    if (!name.trim()) {
      showError("Employee name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        employeeNumber: employeeNumber.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        position: position.trim() || null,
        department: department.trim() || null,
        joinDate: joinDate || null,
        basicSalary: Number(basicSalary) || 0,
        housingAllowance: Number(housingAllowance) || 0,
        transportAllowance: Number(transportAllowance) || 0,
        labourCardNumber: labourCardNumber.trim() || null,
        iban: iban.trim() || null,
        bankRoutingCode: bankRoutingCode.trim() || null,
        isActive,
      };

      const res = await fetch(isEdit ? `/api/employees/${employee!.id}` : "/api/employees", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(isEdit ? "Failed to update employee" : "Failed to create employee", json.error ?? "Please try again.");
        return;
      }
      onSaved(json.employee as EmployeeRecord);
      showSuccess(
        isEdit ? "Employee updated" : "Employee added",
        `${payload.name} has been ${isEdit ? "updated" : "added to your employee list"}.`
      );
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={isEdit ? "Edit Employee" : "Add Employee"} showAiButton={false} />
            <EntityPanelAvatar
              name={name || "New Employee"}
              fallbackGradient="from-sky-400 to-blue-600"
            />

            <EntityPanelFieldGroup>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<User className="h-4 w-4" />} label="Full Name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fatima Al Maktoum"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Employee No.">
                  <Input
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    placeholder="e.g. EMP-001"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Mail className="h-4 w-4" />} label="Email">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.ae"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Phone className="h-4 w-4" />} label="Phone">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Briefcase className="h-4 w-4" />} label="Position">
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Accountant"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Department">
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Finance"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Calendar className="h-4 w-4" />} label="Join Date">
                  <Input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Basic Salary (AED)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="0.00"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Housing Allowance">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={housingAllowance}
                    onChange={(e) => setHousingAllowance(e.target.value)}
                    placeholder="0.00"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<DollarSign className="h-4 w-4" />} label="Transport Allowance">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transportAllowance}
                    onChange={(e) => setTransportAllowance(e.target.value)}
                    placeholder="0.00"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<CreditCard className="h-4 w-4" />} label="Labour Card / MOL ID">
                  <Input
                    value={labourCardNumber}
                    onChange={(e) => setLabourCardNumber(e.target.value)}
                    placeholder="WPS employee unique ID"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Landmark className="h-4 w-4" />} label="Bank Routing Code">
                  <Input
                    value={bankRoutingCode}
                    onChange={(e) => setBankRoutingCode(e.target.value)}
                    placeholder="e.g. 403510101"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Landmark className="h-4 w-4" />} label="IBAN">
                  <Input
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="AE07 0331 2345 6789 0123 456"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Employment" />
            <EntityPanelSidebarSection>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="emp-active"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(v === true)}
                />
                <Label htmlFor="emp-active" className="text-[13px] text-text-secondary">
                  Active employee
                </Label>
              </div>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-4 w-4" />}>
              Salary components post to Dr 6010/6020/6030. Labour card, IBAN, and routing code are used for WPS SIF export.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>
        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Saving…" : isEdit ? "Save changes" : "Add employee"}
          saveDisabled={saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
