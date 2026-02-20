"use client";

import { useState } from "react";
import {
  EntityPanel,
  EntityPanelTrigger,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Info,
  Plus,
} from "lucide-react";

export function AddClientDemo() {
  const [open, setOpen] = useState(false);
  const [lateFeeType, setLateFeeType] = useState("outstanding");

  return (
    <EntityPanel open={open} onOpenChange={setOpen}>
      <EntityPanelTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </EntityPanelTrigger>

      <EntityPanelContent size="lg">
        <EntityPanelBody>
        {/* ── Left: Main Content ── */}
        <EntityPanelMain>
          <EntityPanelHeader
            title="Add Client"
            onAiClick={() => console.log("AI auto-fill")}
          />

          <EntityPanelAiHint>
            Get help using AI to auto-fill client data from database
          </EntityPanelAiHint>

          <EntityPanelAvatar
            name="Alex Johnson"
            subtitle="🏆 Over 8 years in tech, specializing in product management and user experience."
            fallbackGradient="from-purple-300 via-pink-200 to-orange-200"
          />

          <EntityPanelFieldGroup>
            <EntityPanelFieldRow>
              <EntityPanelField
                icon={<User className="h-4 w-4" />}
                label="First Name"
                value="Alex"
              />
              <EntityPanelField
                icon={<User className="h-4 w-4" />}
                label="Last Name"
                value="Johnson"
              />
            </EntityPanelFieldRow>
            <EntityPanelField
              icon={<Building2 className="h-4 w-4" />}
              label="Company Name"
              value="Tech Innovations Inc"
            />
            <EntityPanelField
              icon={<Mail className="h-4 w-4" />}
              label="Email Address"
              value="alex.johnson@techinnovations.com"
            />
            <EntityPanelField
              icon={<Phone className="h-4 w-4" />}
              label="Phone Number"
              value="(555) 987-6543"
            />
            <EntityPanelField
              icon={<Globe className="h-4 w-4" />}
              label="Country"
              value="United States"
            />
          </EntityPanelFieldGroup>

          <EntityPanelLink onClick={() => console.log("Add business details")}>
            Add Business details
          </EntityPanelLink>
        </EntityPanelMain>

        {/* ── Right: Settings Sidebar ── */}
        <EntityPanelSidebar>
          <EntityPanelSidebarHeader title="Client Settings" onBack={() => {}} />

          <EntityPanelSidebarSection>
            <h3 className="mb-3 text-[15px] font-semibold text-text-primary">
              Send Payment Reminders
            </h3>
            <div className="flex items-start gap-2">
              <Checkbox id="late-fees" defaultChecked className="mt-0.5" />
              <Label
                htmlFor="late-fees"
                className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer"
              >
                Automatically add late fees to this client&apos;s overdue invoices
              </Label>
            </div>
          </EntityPanelSidebarSection>

          <EntityPanelSidebarSection title="Late Fee Amount">
            <RadioGroup
              value={lateFeeType}
              onValueChange={setLateFeeType}
              className="gap-2.5"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percentage" id="fee-pct" />
                <Label htmlFor="fee-pct" className="text-[13px] font-normal cursor-pointer">
                  Percentage of Invoice value
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="outstanding" id="fee-out" />
                <Label htmlFor="fee-out" className="text-[13px] font-normal cursor-pointer">
                  Percentage of outstanding balance
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  defaultValue={10}
                  className="h-8 w-16 text-center text-[14px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="flat" id="fee-flat" />
                <Label htmlFor="fee-flat" className="text-[13px] font-normal cursor-pointer">
                  Flat Fee
                </Label>
              </div>
            </RadioGroup>
          </EntityPanelSidebarSection>

          <EntityPanelSidebarSection title="When?">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                defaultValue={30}
                className="h-8 w-16 text-center text-[14px]"
              />
              <span className="text-[13px] text-text-secondary">
                days after due date
              </span>
            </div>
          </EntityPanelSidebarSection>

          <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
            Charges will also apply to if any new invoices
          </EntityPanelInfoMessage>
        </EntityPanelSidebar>
        </EntityPanelBody>

        {/* ── Footer ── */}
        <EntityPanelFooter
          onCancel={() => setOpen(false)}
          onSave={() => {
            console.log("Save client");
            setOpen(false);
          }}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
