"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  widgetId: string;
  visible: boolean;
  children: React.ReactNode;
  className?: string;
  /** When true, wraps children in a dashboard-card container */
  cardWrap?: boolean;
}

class WidgetErrorBoundary extends React.Component<
  { widgetId: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { widgetId: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[DashboardWidget:${this.props.widgetId}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-xs text-muted-foreground italic">
          Widget failed to render.
        </p>
      );
    }
    return this.props.children;
  }
}

export function DashboardWidget({ widgetId, visible, children, className, cardWrap }: DashboardWidgetProps) {
  if (!visible) return null;
  return (
    <WidgetErrorBoundary widgetId={widgetId}>
      <div
        data-widget-id={widgetId}
        className={cn(cardWrap && "dashboard-card p-6", className)}
      >
        {children}
      </div>
    </WidgetErrorBoundary>
  );
}
