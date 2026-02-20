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
  EntityPanelLink,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelAiHint,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Receipt,
  Calendar,
  Info,
} from "lucide-react";

interface AddSupplierPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (supplier: {
    name: string;
    email: string;
    phone: string;
    taxNumber: string;
    city: string;
    country: string;
    paymentTermsDays: number;
  }) => void;
}

export function AddSupplierPanel({ open, onOpenChange, onAdd }: AddSupplierPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [city, setCity] = useState("Dubai");
  const [country, setCountry] = useState("UAE");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);

  function reset() {
    setName(""); setEmail(""); setPhone(""); setTaxNumber("");
    setCity("Dubai"); setCountry("UAE"); setPaymentTermsDays("30");
    setAutoPayEnabled(false);
  }

  function handleSave() {
    if (!name.trim()) { showError("Company name is required"); return; }
    onAdd({ name, email, phone, taxNumber, city, country, paymentTermsDays: Number(paymentTermsDays) });
    showSuccess("Supplier added", `${name} has been added to your supplier list.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          {/* ── Left: Main Content ── */}
          <EntityPanelMain>
            <EntityPanelHeader
              title="Add Supplier"
              onAiClick={() => showSuccess("AI Auto-fill", "Paste a supplier invoice or website URL to auto-fill details.")}
            />

            <EntityPanelAiHint>
              Get help using AI to auto-fill supplier data from invoices or website
            </EntityPanelAiHint>

            <EntityPanelAvatar
              name={name || "New Supplier"}
              subtitle={city && country ? `${city}, ${country}` : undefined}
              fallbackGradient="from-orange-300 via-amber-200 to-yellow-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Company Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gulf Supplies LLC" className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Mail className="h-4 w-4" />} label="Email Address">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@supplier.ae" className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
                </EntityPanelField>
                <EntityPanelField icon={<Phone className="h-4 w-4" />} label="Phone Number">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 4 XXX XXXX" className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelField icon={<Receipt className="h-4 w-4" />} label="TRN (Tax Registration Number)">
                <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="300XXXXXXXXX003" className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<MapPin className="h-4 w-4" />} label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
                </EntityPanelField>
                <EntityPanelField icon={<Globe className="h-4 w-4" />} label="Country">
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20" />
                </EntityPanelField>
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>

            <EntityPanelLink onClick={() => showSuccess("Bank Details", "Additional fields for bank account, IBAN and SWIFT will appear here.")}>
              Add Bank details
            </EntityPanelLink>
          </EntityPanelMain>

          {/* ── Right: Settings Sidebar ── */}
          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Supplier Settings" />

            <EntityPanelSidebarSection title="Payment Terms">
              <div className="flex items-center gap-2">
                <Input type="number" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} className="h-8 w-20 text-center text-[14px]" />
                <span className="text-[13px] text-text-secondary">days after invoice date</span>
              </div>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection>
              <h3 className="mb-3 text-[15px] font-semibold text-text-primary">Auto-Pay</h3>
              <div className="flex items-start gap-2">
                <Checkbox id="auto-pay" checked={autoPayEnabled} onCheckedChange={(v) => setAutoPayEnabled(!!v)} className="mt-0.5" />
                <Label htmlFor="auto-pay" className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer">
                  Automatically schedule payment on due date
                </Label>
              </div>
            </EntityPanelSidebarSection>

            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Supplier will be matched to bank transactions automatically using their name and TRN
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Add Supplier"
          saveDisabled={!name.trim()}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
