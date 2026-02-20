"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const StyledSelect = forwardRef<HTMLSelectElement, StyledSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-xl border border-border-subtle bg-surface pl-3 pr-8 text-[13px] text-text-primary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/30",
            "hover:border-border-subtle/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-meta" />
      </div>
    );
  },
);
StyledSelect.displayName = "StyledSelect";

export { StyledSelect };
