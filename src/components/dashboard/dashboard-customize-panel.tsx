"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  WIDGET_LABELS,
  type DashboardVariant,
  useDashboardPillPreferences,
} from "@/hooks/use-dashboard-pill-preferences";

interface DashboardCustomizePanelProps {
  variant: DashboardVariant;
}

export function DashboardCustomizePanel({ variant }: DashboardCustomizePanelProps) {
  const { visible, setVisible, reset, widgetIds } = useDashboardPillPreferences(variant);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">Choose which widgets to show in your mini dashboard.</p>
      <div className="grid gap-2">
        {widgetIds.map((id) => (
          <label
            key={id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={visible[id] ?? true}
              onCheckedChange={(checked) => setVisible(id, checked === true)}
            />
            <span className="text-[13px] text-text-primary">{WIDGET_LABELS[id] ?? id}</span>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Reset to default
      </Button>
    </div>
  );
}
