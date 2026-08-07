"use client";

import { useHasDashboardAccess } from "@/components/auth/role-store";
import { MobileTopBar } from "@/components/dashboard/mobile-nav";
import { TopNav } from "@/components/dashboard/top-nav";
import { cn } from "@/lib/utils";

/* Yerleşim kabuğu. Tam sayfa genişliğinde yatay üst menü (TopNav). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const hasAccess = useHasDashboardAccess();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F1F5F9] text-slate-900">
      <MobileTopBar />
      <TopNav />

      <main
        className={cn(
          "relative z-10 min-h-screen px-4 pb-10 pt-20 sm:px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-20 md:pt-24 max-w-[1920px] mx-auto"
        )}
      >
        <div className="space-y-5">{children}</div>
      </main>
    </div>
  );
}
