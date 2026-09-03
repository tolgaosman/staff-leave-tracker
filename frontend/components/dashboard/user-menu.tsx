"use client";

import { Menu } from "@base-ui/react/menu";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useHasDashboardAccess } from "@/components/auth/role-store";
import { Avatar } from "@/components/dashboard/avatar";

import Link from "next/link";

const popupClasses =
  "z-50 rounded-xl border border-slate-200 bg-white p-1.5 outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const itemClasses =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900";

export function UserMenu() {
  const { user, logout } = useAuth();
  const hasAccess = useHasDashboardAccess();

  if (hasAccess && user?.role === "super_admin") {
    return (
      <button
        onClick={logout}
        className="flex size-8 sm:size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        title="Çıkış Yap"
      >
        <LogOut className="size-4" />
      </button>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="User menu"
        className="rounded-full outline-none transition-transform active:scale-95 data-[popup-open]:ring-2 data-[popup-open]:ring-[#7b1e2b]/30"
      >
        {user ? (
          <Avatar name={user.name} url={user.avatarUrl} className="size-8 sm:size-9 border border-slate-200" />
        ) : (
          <span className="flex size-8 sm:size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <User className="size-4" />
          </span>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={12} align="end" className="z-50">
          <Menu.Popup className={`${popupClasses} w-60`}>
            {user ? (
              <>
                <div className="border-b border-border px-3 pb-2 pt-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user.email}
                  </p>
                </div>
                <Menu.Item
                  render={<Link href="/profile" />}
                  className={itemClasses}
                >
                  <User className="size-4" />
                  Profil
                </Menu.Item>
                <Menu.Separator className="my-1 h-px bg-slate-200" />
                <Menu.Item
                  onClick={logout}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors data-[highlighted]:bg-red-50"
                >
                  <LogOut className="size-4" />
                  Çıkış Yap
                </Menu.Item>
              </>
            ) : (
              <div className="py-1">
                <Menu.Item className="p-0 outline-none">
                  <Link
                    href="/login"
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100"
                  >
                    <LogIn className="size-4" />
                    Giriş Yap
                  </Link>
                </Menu.Item>
              </div>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
