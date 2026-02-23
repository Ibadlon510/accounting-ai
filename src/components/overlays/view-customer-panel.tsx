"use client";

import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelFieldRow,
  EntityPanelField,
  EntityPanelFooter,
} from "@/components/overlays/entity-panel";
import { formatNumber } from "@/lib/accounting/engine";
type Customer = { id: string; name: string; email: string; phone: string; taxNumber: string; city: string; country: string; currency: string; creditLimit: number; paymentTermsDays: number; isActive: boolean; outstandingBalance: number };
import { Building2, Mail, Phone, MapPin, Globe, Receipt, CreditCard } from "lucide-react";

interface ViewCustomerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | undefined | null;
}

export function ViewCustomerPanel({ open, onOpenChange, customer }: ViewCustomerPanelProps) {
  if (!customer) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Customer Details" showAiButton={false} />

            <EntityPanelAvatar
              name={customer.name}
              subtitle={`${customer.city}, ${customer.country}`}
              fallbackGradient="from-blue-300 via-cyan-200 to-teal-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Status">
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${customer.isActive ? "bg-success-light text-success" : "bg-error-light text-error"}`}
                >
                  {customer.isActive ? "Active" : "Inactive"}
                </span>
              </EntityPanelField>
              <EntityPanelField
                icon={<Building2 className="h-4 w-4" />}
                label="Company Name"
                value={customer.name}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={customer.email}
                />
                <EntityPanelField
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={customer.phone}
                />
              </EntityPanelFieldRow>
              <EntityPanelField
                icon={<Receipt className="h-4 w-4" />}
                label="TRN (Tax Registration Number)"
                value={customer.taxNumber}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<MapPin className="h-4 w-4" />}
                  label="City"
                  value={customer.city}
                />
                <EntityPanelField
                  icon={<Globe className="h-4 w-4" />}
                  label="Country"
                  value={customer.country}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Credit Limit"
                  value={`AED ${formatNumber(customer.creditLimit)}`}
                />
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Payment Terms"
                  value={`${customer.paymentTermsDays} days`}
                />
              </EntityPanelFieldRow>
              <EntityPanelField
                icon={<CreditCard className="h-4 w-4" />}
                label="Outstanding Balance"
                value={`AED ${formatNumber(customer.outstandingBalance)}`}
              />
            </EntityPanelFieldGroup>
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" />
      </EntityPanelContent>
    </EntityPanel>
  );
}
