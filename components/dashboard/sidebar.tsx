"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHasDashboardAccess } from "@/components/auth/role-store";
import { isNavItemActive, navItems } from "@/components/dashboard/nav-items";
import { NewRequestDialog } from "@/components/dashboard/new-request-dialog";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const hasAccess = useHasDashboardAccess();
  const visibleItems = navItems.filter((item) => hasAccess || !item.adminOnly);

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-outline-variant/30 bg-sidebar p-6 shadow-[40px_0_40px_0px_rgba(23,30,30,0.02)] md:flex">
      <div className="mb-10 mt-4 flex items-center gap-3 px-4">
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/logoLight.png`}
          alt="İzin Takip Sistemi Logo"
          className="h-9 w-9 object-contain dark:hidden"
        />
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/logoDark.png`}
          alt="İzin Takip Sistemi Logo"
          className="hidden h-9 w-9 object-contain dark:block"
        />
        <div>
          <h1 className="font-serif text-lg font-bold leading-tight text-primary">
            İzin Takip
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-secondary/70">
            Sistemi
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {visibleItems.map(({ label, icon: Icon, href }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 py-2 transition-all active:scale-95",
                active
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant opacity-70 hover:text-primary transition-colors"
              )}
            >
              <Icon className="size-5" />
              <span className="font-sans text-base">
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {!hasAccess && (
        <div className="mt-auto pt-6 border-t border-outline-variant/30">
          <NewRequestDialog />
        </div>
      )}
    </nav>
  );
}
