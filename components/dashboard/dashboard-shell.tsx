"use client";

import { useHasDashboardAccess } from "@/components/auth/role-store";
import { MobileTopBar } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { cn } from "@/lib/utils";

/* Yerleşim kabuğu. Admin'de sol menü (Sidebar) + içerik sol boşluğu var;
   çalışanda sol menü tamamen kaldırılır ve içerik tam genişlik olur
   (logo/başlık TopNav'ın sol üstüne taşınır). */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const hasAccess = useHasDashboardAccess();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-accent-violet/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-cyan/20 blur-[100px]" />
      </div>

      {hasAccess && <Sidebar />}
      <MobileTopBar />
      <TopNav />

      <main
        className={cn(
          "relative z-10 min-h-screen px-3 pb-10 pt-20 sm:px-4 md:px-10 md:pt-32",
          hasAccess && "md:ml-64"
        )}
      >
        <div className="space-y-4">{children}</div>
      </main>
    </div>
  );
}
