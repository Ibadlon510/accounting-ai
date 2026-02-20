"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────
   EntityPanel – Root (wraps Radix Dialog)
   ───────────────────────────────────────────── */
function EntityPanel({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

const EntityPanelTrigger = DialogPrimitive.Trigger;

/* ─────────────────────────────────────────────
   EntityPanelOverlay
   ───────────────────────────────────────────── */
function EntityPanelOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

/* ─────────────────────────────────────────────
   EntityPanelContent – Right slide-in panel
   ───────────────────────────────────────────── */
function EntityPanelContent({
  className,
  children,
  size = "lg",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    md: "max-w-[680px]",
    lg: "max-w-[920px]",
    xl: "max-w-[1080px]",
  };

  return (
    <DialogPrimitive.Portal>
      <EntityPanelOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-3 right-3 z-50",
          "flex flex-col w-[calc(100%-4rem)]",
          sizeClasses[size],
          "overflow-hidden",
          "rounded-2xl bg-surface border border-border-card shadow-overlay",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
          "duration-300 ease-out outline-none",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelBody – Row wrapper for Main + Sidebar
   ───────────────────────────────────────────── */
function EntityPanelBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-1 min-h-0 overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelMain – Left main content area
   ───────────────────────────────────────────── */
function EntityPanelMain({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-1 flex-col min-w-0", className)} {...props}>
      <ScrollArea className="flex-1">
        <div className="px-8 py-6">{children}</div>
      </ScrollArea>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelSidebar – Right settings panel
   ───────────────────────────────────────────── */
function EntityPanelSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-[300px] shrink-0 flex-col border-l border-border-subtle bg-muted/30",
        className
      )}
      {...props}
    >
      <ScrollArea className="flex-1">
        <div className="px-6 py-6">{children}</div>
      </ScrollArea>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelHeader – Top bar in the main panel
   ───────────────────────────────────────────── */
function EntityPanelHeader({
  className,
  title,
  showAiButton = true,
  onAiClick,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
  showAiButton?: boolean;
  onAiClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-6",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <DialogPrimitive.Close asChild>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </DialogPrimitive.Close>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-text-meta">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-1">
        {showAiButton && (
          <button
            onClick={onAiClick}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
            title="Get help using AI"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelAvatar – Avatar / profile display
   ───────────────────────────────────────────── */
function EntityPanelAvatar({
  className,
  name,
  subtitle,
  image,
  fallbackGradient = "from-purple-300 via-pink-200 to-orange-200",
  fallbackInitials,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  name?: string;
  subtitle?: string;
  image?: string;
  fallbackGradient?: string;
  fallbackInitials?: string;
}) {
  const initials =
    fallbackInitials ||
    (name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?");

  return (
    <div
      className={cn("flex flex-col items-center mb-6", className)}
      {...props}
    >
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full mb-3",
          image ? "" : `bg-gradient-to-br ${fallbackGradient}`
        )}
      >
        {image ? (
          <img
            src={image}
            alt={name || "Avatar"}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold text-white/80">
            {initials}
          </span>
        )}
      </div>
      {name && (
        <h3 className="text-xl font-semibold text-text-primary">{name}</h3>
      )}
      {subtitle && (
        <p className="mt-0.5 text-[13px] text-text-secondary text-center max-w-[300px]">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelFieldGroup – Bordered group of fields
   ───────────────────────────────────────────── */
function EntityPanelFieldGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle divide-y divide-border-subtle overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelFieldRow – Horizontal row inside a group
   ───────────────────────────────────────────── */
function EntityPanelFieldRow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex divide-x divide-border-subtle",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelField – Single icon + label + value
   ───────────────────────────────────────────── */
function EntityPanelField({
  className,
  icon,
  label,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-4 flex-1 min-w-0",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-text-secondary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          {label}
        </p>
        {value && (
          <p className="mt-0.5 truncate text-[14px] font-medium text-text-primary">
            {value}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelLink – "+ Add something" link
   ───────────────────────────────────────────── */
function EntityPanelLink({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "mt-4 flex items-center gap-1 text-[14px] font-semibold text-success transition-colors hover:text-success/80",
        className
      )}
      {...props}
    >
      <span className="text-[16px]">+</span>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelSidebarHeader – Back + title
   ───────────────────────────────────────────── */
function EntityPanelSidebarHeader({
  className,
  title,
  onBack,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className={cn("mb-5", className)} {...props}>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="uppercase tracking-wider">{title}</span>
        </button>
      )}
      {!onBack && (
        <p className="text-[12px] font-semibold uppercase tracking-wider text-text-meta">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelSidebarSection – Labeled section
   ───────────────────────────────────────────── */
function EntityPanelSidebarSection({
  className,
  title,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title?: string;
}) {
  return (
    <div className={cn("mb-5", className)} {...props}>
      {title && (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelFooter – Cancel + Save
   ───────────────────────────────────────────── */
function EntityPanelFooter({
  className,
  onCancel,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saveDisabled = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
      {onCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      {onSave && (
        <Button
          size="sm"
          onClick={onSave}
          disabled={saveDisabled}
          className="rounded-xl bg-success px-6 text-white hover:bg-success/90"
        >
          {saveLabel}
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelAiHint – AI auto-fill hint text
   ───────────────────────────────────────────── */
function EntityPanelAiHint({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[12px] text-text-meta text-center mb-4",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────
   EntityPanelInfoMessage – Info/warning box
   ───────────────────────────────────────────── */
function EntityPanelInfoMessage({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-3 text-[12px] text-text-secondary",
        className
      )}
      {...props}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

export {
  EntityPanel,
  EntityPanelTrigger,
  EntityPanelOverlay,
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
};
