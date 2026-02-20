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
  CreditCard,
  Calendar,
  Info,
} from "lucide-react";

interface AddCustomerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (customer: {
    name: string;
    email: string;
    phone: string;
    taxNumber: string;
    city: string;
    country: string;
    creditLimit: number;
    paymentTermsDays: number;
  }) => void;
}

export function AddCustomerPanel({ open, onOpenChange, onAdd }: AddCustomerPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [city, setCity] = useState("Dubai");
  const [country, setCountry] = useState("UAE");
  const [creditLimit, setCreditLimit] = useState("100000");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [sendReminders, setSendReminders] = useState(true);

  function reset() {
    setName(""); setEmail(""); setPhone(""); setTaxNumber("");
    setCity("Dubai"); setCountry("UAE"); setCreditLimit("100000"); setPaymentTermsDays("30");
    setSendReminders(true);
  }

  function handleSave() {
    if (!name.trim()) { showError("Company name is required"); return; }
    onAdd({
      name, email, phone, taxNumber, city, country,
      creditLimit: Number(creditLimit),
      paymentTermsDays: Number(paymentTermsDays),
    });
    showSuccess("Customer added", `${name} has been added to your customer list.`);
    reset();
    onOpenChange(false);
  }

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          {/* ── Left: Main Content ── */}
          <EntityPanelMain>
            <EntityPanelHeader
              title="Add Customer"
              onAiClick={() => showSuccess("AI Auto-fill", "Paste a business card or website URL to auto-fill customer details.")}
            />

            <EntityPanelAiHint>
              Get help using AI to auto-fill customer data from trade license or website
            </EntityPanelAiHint>

            <EntityPanelAvatar
              name={name || "New Customer"}
              subtitle={city && country ? `${city}, ${country}` : undefined}
              fallbackGradient="from-blue-300 via-cyan-200 to-teal-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<Building2 className="h-4 w-4" />}
                label="Company Name"
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Al Noor Trading LLC"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@company.ae"
                    className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                  />
                </EntityPanelField>
                <EntityPanelField
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                >
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 4 XXX XXXX"
                    className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelField
                icon={<Receipt className="h-4 w-4" />}
                label="TRN (Tax Registration Number)"
              >
                <Input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="100XXXXXXXXX003"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<MapPin className="h-4 w-4" />}
                  label="City"
                >
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                  />
                </EntityPanelField>
                <EntityPanelField
                  icon={<Globe className="h-4 w-4" />}
                  label="Country"
                >
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>

            <EntityPanelLink onClick={() => showSuccess("Business Details", "Additional fields for address, website, and notes will appear here.")}>
              Add Business details
            </EntityPanelLink>
          </EntityPanelMain>

          {/* ── Right: Settings Sidebar ── */}
          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Customer Settings" />

            <EntityPanelSidebarSection title="Credit Terms">
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-[12px] text-text-secondary">Credit Limit (AED)</Label>
                  <Input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="h-8 rounded-lg text-[14px]"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12px] text-text-secondary">Payment Terms</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={paymentTermsDays}
                      onChange={(e) => setPaymentTermsDays(e.target.value)}
                      className="h-8 w-20 text-center text-[14px]"
                    />
                    <span className="text-[13px] text-text-secondary">days</span>
                  </div>
                </div>
              </div>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection>
              <h3 className="mb-3 text-[15px] font-semibold text-text-primary">
                Payment Reminders
              </h3>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="send-reminders"
                  checked={sendReminders}
                  onCheckedChange={(v) => setSendReminders(!!v)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="send-reminders"
                  className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer"
                >
                  Send automatic payment reminders before and after due date
                </Label>
              </div>
            </EntityPanelSidebarSection>

            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Customer will receive invoices and statements at the email address provided
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        {/* ── Footer ── */}
        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Add Customer"
          saveDisabled={!name.trim()}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
