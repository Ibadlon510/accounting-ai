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
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import { Calendar, FolderKanban, Hash, Info, Tag } from "lucide-react";

export type ProjectRecord = {
  id: string;
  code: string | null;
  name: string;
  kind: "project" | "cost_centre";
  status: "active" | "completed" | "archived";
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  notes: string | null;
};

interface AddProjectPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (project: ProjectRecord) => void;
}

export function AddProjectPanel({
  open,
  onOpenChange,
  onSaved,
}: AddProjectPanelProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"project" | "cost_centre">("project");
  const [status, setStatus] = useState<"active" | "completed" | "archived">(
    "active"
  );
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setCode("");
    setKind("project");
    setStatus("active");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setDescription("");
  }

  async function handleSave() {
    if (!name.trim()) {
      showError("Project name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          kind,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          description: description.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create project");
        return;
      }
      showSuccess("Project created", json.project.name);
      onSaved(json.project);
      reset();
      onOpenChange(false);
    } catch {
      showError("Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Create Project" />
            <EntityPanelAvatar
              name={name || "New Project"}
              subtitle="Project or cost centre for income & cost tracking"
              fallbackGradient="from-slate-700 to-stone-900"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<FolderKanban className="h-4 w-4" />}
                label="Name"
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marina fit-out"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Code">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PRJ-001"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField icon={<Tag className="h-4 w-4" />} label="Kind">
                  <StyledSelect
                    value={kind}
                    onChange={(e) =>
                      setKind(
                        e.target.value === "cost_centre"
                          ? "cost_centre"
                          : "project"
                      )
                    }
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  >
                    <option value="project">Project</option>
                    <option value="cost_centre">Cost centre</option>
                  </StyledSelect>
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Start date"
                >
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="End date"
                >
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelField icon={<Info className="h-4 w-4" />} label="Status">
                <StyledSelect
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "active" || v === "completed" || v === "archived") {
                      setStatus(v);
                    }
                  }}
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </StyledSelect>
              </EntityPanelField>
              <EntityPanelField
                icon={<Info className="h-4 w-4" />}
                label="Description"
              >
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
            <EntityPanelSidebarHeader title="Costing" />
            <EntityPanelSidebarSection title="Tagging">
              <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
                Tag invoices (income), bills (cost), or journal lines with this
                project. Project P&amp;L aggregates tagged ledger and document
                activity.
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Saving…" : "Create project"}
          saveDisabled={saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
