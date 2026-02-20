"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConfidenceLevel = "high" | "medium" | "low" | "error" | "none";

interface SmartFieldProps {
  label: string;
  confidence?: number;
  hasError?: boolean;
  errorMessage?: string;
  tooltipText?: string;
  children?: React.ReactNode;
  className?: string;
  // Pass-through for simple input usage
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
  inputClassName?: string;
}

function getConfidenceLevel(confidence?: number, hasError?: boolean): ConfidenceLevel {
  if (hasError) return "error";
  if (confidence == null) return "none";
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

const confidenceConfig: Record<ConfidenceLevel, {
  className: string;
  icon: React.ElementType | null;
  iconClass: string;
  defaultTooltip: string;
}> = {
  high: {
    className: "field-confidence-high",
    icon: CheckCircle2,
    iconClass: "text-[var(--confidence-high)]",
    defaultTooltip: "AI is confident about this value",
  },
  medium: {
    className: "field-confidence-medium",
    icon: AlertTriangle,
    iconClass: "text-[var(--confidence-medium)]",
    defaultTooltip: "AI was unsure about this value — please verify",
  },
  low: {
    className: "field-confidence-low",
    icon: AlertCircle,
    iconClass: "text-[var(--confidence-low)]",
    defaultTooltip: "Low confidence — manual review required",
  },
  error: {
    className: "field-confidence-low",
    icon: AlertCircle,
    iconClass: "text-[var(--confidence-low)]",
    defaultTooltip: "Logic error detected",
  },
  none: {
    className: "",
    icon: null,
    iconClass: "",
    defaultTooltip: "",
  },
};

export function SmartField({
  label,
  confidence,
  hasError,
  errorMessage,
  tooltipText,
  children,
  className,
  value,
  onChange,
  type,
  placeholder,
  required,
  step,
  min,
  inputClassName,
}: SmartFieldProps) {
  const level = getConfidenceLevel(confidence, hasError);
  const config = confidenceConfig[level];
  const Icon = config.icon;
  const tip = errorMessage || tooltipText || config.defaultTooltip;

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 transition-all",
        config.className,
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <Label className="text-[13px] font-medium text-text-primary">{label}</Label>
        {Icon && tip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("flex items-center", config.iconClass)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-[12px]">
              {tip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children ?? (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          step={step}
          min={min}
          className={cn(
            "h-9 rounded-lg border-border-subtle text-[13px]",
            inputClassName
          )}
        />
      )}
      {hasError && errorMessage && (
        <p className="mt-1 text-[11px] text-[var(--confidence-low)]">{errorMessage}</p>
      )}
    </div>
  );
}
