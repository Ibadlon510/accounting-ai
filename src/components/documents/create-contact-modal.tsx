"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { Plus } from "lucide-react";

type ContactType = "customer" | "supplier";

type CreateContactModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContactType;
  initialName?: string;
  onCreated: (contact: { id: string; name: string }) => void;
};

export function CreateContactModal({
  open,
  onOpenChange,
  type,
  initialName = "",
  onCreated,
}: CreateContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail("");
      setPhone("");
      setTaxNumber("");
    }
  }, [open, initialName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = type === "customer" ? "/api/sales/customers" : "/api/purchases/suppliers";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          taxNumber: taxNumber.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create");
      }
      const data = await res.json();
      const contact = type === "customer" ? data.customer : data.supplier;
      if (contact?.id && contact?.name) {
        onCreated({ id: contact.id, name: contact.name });
        showSuccess(
          type === "customer" ? "Customer added" : "Supplier added",
          `${contact.name} has been added.`
        );
        onOpenChange(false);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      showError(
        type === "customer" ? "Could not add customer" : "Could not add supplier",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const label = type === "customer" ? "Customer" : "Supplier";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add {label}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact-name" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
              Name *
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "customer" ? "Customer name" : "Supplier name"}
              className="mt-1.5 h-9 rounded-lg text-[13px]"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-email" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
              Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@company.ae"
              className="mt-1.5 h-9 rounded-lg text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-phone" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Phone
              </Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 4 XXX XXXX"
                className="mt-1.5 h-9 rounded-lg text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="contact-trn" className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                TRN
              </Label>
              <Input
                id="contact-trn"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="100XXXXXXXXX003"
                className="mt-1.5 h-9 rounded-lg text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-xl bg-success px-5 text-[13px] font-semibold text-white hover:bg-success/90"
            >
              {saving ? "Creating..." : `Add ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
