"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { useHasDashboardAccess } from "@/components/auth/role-store";
import { UserMenu } from "@/components/dashboard/user-menu";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { isNavItemActive, navItems } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { user } = useAuth();
  const hasAccess = useHasDashboardAccess();
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => hasAccess || !item.adminOnly);

  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-30 hidden h-[72px] items-center justify-between bg-white px-6 border-b border-slate-200 md:flex">
      <div className="flex flex-1 items-center justify-start">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80 pl-12">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/siteLogo.png`}
            alt="İzin Takip Sistemi Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {/* Horizontal Navigation */}
        <nav className="flex items-center gap-1">
          {visibleItems.map(({ label, icon: Icon, href }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150 whitespace-nowrap",
                  active
                    ? "bg-[#f9eced] text-[#7b1e2b] font-medium"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="text-sm font-medium text-slate-500 capitalize mr-4">
          {dateStr}
        </div>
        {(user?.role === 'super_admin' || user?.role === 'manager') && <RoleSwitcher />}
        <UserMenu />
      </div>
    </header>
  );
}
