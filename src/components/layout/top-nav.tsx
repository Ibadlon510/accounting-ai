"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  FileText,
  ShoppingCart,
  Package,
  Landmark,
  BarChart3,
  Receipt,
  Settings,
  Bell,
  Grid3X3,
  FolderOpen,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { comingSoon } from "@/lib/utils/toast-helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { TokenMeter } from "@/components/ui/token-meter";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BookOpen, label: "Accounting", href: "/accounting" },
  { icon: FileText, label: "Sales", href: "/sales" },
  { icon: ShoppingCart, label: "Purchases", href: "/purchases" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Landmark, label: "Banking", href: "/banking" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Receipt, label: "VAT", href: "/vat" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function TopNav() {
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <header className="flex items-center justify-between px-6 py-3">
      {/* Left: Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-white"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-text-primary">Agar</span>
          <span className="text-[11px] font-medium text-text-secondary">Smart Accounting</span>
        </div>
      </Link>

      {/* Center: Navigation Pill */}
      <nav className="glass-nav flex items-center gap-1 rounded-full px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-full transition-all duration-200",
                    active
                      ? "gap-1.5 bg-text-primary px-3.5 text-white shadow-sm"
                      : "w-9 text-text-secondary hover:bg-black/5 hover:text-text-primary"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  {active && (
                    <span className="text-[12px] font-semibold">{item.label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {!active && (
                <TooltipContent side="bottom" className="text-[12px]">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Right: Token Meter + Profile */}
      <div className="flex items-center gap-3">
        <TokenMeter />
        <div className="mr-1 text-right">
          <p className="text-[13px] font-semibold leading-tight text-text-primary">
            Demo User
          </p>
          <p className="text-[11px] leading-tight text-text-meta">
            Admin
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-text-primary/20">
              <Avatar className="h-8 w-8 border border-border-subtle cursor-pointer">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-[11px] font-semibold text-white">
                  DU
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-error focus:text-error">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-0.5">
          <button onClick={() => comingSoon("Notifications")} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </Link>
          <button onClick={() => comingSoon("App Launcher")} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary">
            <Grid3X3 className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
