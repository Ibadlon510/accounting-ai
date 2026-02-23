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
type Supplier = { id: string; name: string; email: string; phone: string; taxNumber: string; city: string; country: string; currency: string; paymentTermsDays: number; isActive: boolean; outstandingBalance: number };
import { Building2, Mail, Phone, MapPin, Globe, Receipt, Calendar } from "lucide-react";

interface ViewSupplierPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | undefined | null;
}

export function ViewSupplierPanel({ open, onOpenChange, supplier }: ViewSupplierPanelProps) {
  if (!supplier) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Supplier Details" showAiButton={false} />

            <EntityPanelAvatar
              name={supplier.name}
              subtitle={`${supplier.city}, ${supplier.country}`}
              fallbackGradient="from-orange-300 via-amber-200 to-yellow-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Status">
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${supplier.isActive ? "bg-success-light text-success" : "bg-error-light text-error"}`}
                >
                  {supplier.isActive ? "Active" : "Inactive"}
                </span>
              </EntityPanelField>
              <EntityPanelField
                icon={<Building2 className="h-4 w-4" />}
                label="Company Name"
                value={supplier.name}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={supplier.email}
                />
                <EntityPanelField
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={supplier.phone}
                />
              </EntityPanelFieldRow>
              <EntityPanelField
                icon={<Receipt className="h-4 w-4" />}
                label="TRN (Tax Registration Number)"
                value={supplier.taxNumber}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<MapPin className="h-4 w-4" />}
                  label="City"
                  value={supplier.city}
                />
                <EntityPanelField
                  icon={<Globe className="h-4 w-4" />}
                  label="Country"
                  value={supplier.country}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Payment Terms"
                  value={`${supplier.paymentTermsDays} days`}
                />
                <EntityPanelField
                  icon={<Receipt className="h-4 w-4" />}
                  label="Outstanding Balance"
                  value={`AED ${formatNumber(supplier.outstandingBalance)}`}
                />
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" />
      </EntityPanelContent>
    </EntityPanel>
  );
}
