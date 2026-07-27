"use client";

import { useMemo, useState, useEffect } from "react";
import { Popover } from "@base-ui/react/popover";
import { Bell } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { useHasDashboardAccess } from "@/components/auth/role-store";
import { UserMenu } from "@/components/dashboard/user-menu";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 30) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

const iconButtonClasses =
  "flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary data-[popup-open]:bg-black/5 data-[popup-open]:text-primary";

const popupClasses =
  "glass-panel z-50 rounded-xl p-2 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

export function TopNav() {
  const { user } = useAuth();
  const hasAccess = useHasDashboardAccess();

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
    <header
      className={`absolute ${
        hasAccess ? "left-64" : "left-0"
      } right-0 top-0 z-30 hidden h-20 items-center justify-between px-10 border-b border-outline-variant/20 bg-transparent md:flex`}
    >
      {hasAccess ? (
        <div className="font-serif text-base font-bold text-primary capitalize">
          {dateStr}
        </div>
      ) : (
        <Link href="/" className="flex items-center gap-3 pl-4 transition-opacity hover:opacity-80">
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
            <p className="font-mono text-[10px] tracking-wider text-on-surface-variant">
              SİSTEMİ
            </p>
          </div>
        </Link>
      )}

      <div className="flex items-center gap-4">
        {user?.role === 'super_admin' && <RoleSwitcher />}
        <ThemeToggle />



        <UserMenu />
      </div>
    </header>
  );
}

