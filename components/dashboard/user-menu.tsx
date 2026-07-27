"use client";

import { Menu } from "@base-ui/react/menu";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useHasDashboardAccess } from "@/components/auth/role-store";
import { Avatar } from "@/components/dashboard/avatar";

import Link from "next/link";

const popupClasses =
  "glass-panel z-50 rounded-xl p-2 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const itemClasses =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-base text-on-surface outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-accent-cyan";

export function UserMenu() {
  const { user, logout } = useAuth();
  const hasAccess = useHasDashboardAccess();

  if (hasAccess) {
    return (
      <button
        onClick={logout}
        className="flex size-8 sm:size-9 md:size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Çıkış Yap"
      >
        <LogOut className="size-4 sm:size-5" />
      </button>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="User menu"
        className="rounded-full outline-none transition-transform active:scale-95 data-[popup-open]:ring-2 data-[popup-open]:ring-accent-cyan/50"
      >
        {user && hasAccess ? (
          <Avatar name={user.name} url={user.avatarUrl} className="size-8 sm:size-9 md:size-10 border border-accent-cyan/30" />
        ) : (
          <span className="flex size-8 sm:size-9 md:size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary data-[popup-open]:bg-black/5 data-[popup-open]:text-primary">
            <User className="size-4 sm:size-5" />
          </span>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={12} align="end" className="z-50">
          <Menu.Popup className={`${popupClasses} w-60`}>
            {user ? (
              <>
                <div className="border-b border-border px-3 pb-2 pt-1">
                  <p className="truncate text-base font-bold text-on-surface">
                    {user.name}
                  </p>
                  <p className="truncate font-label-mono text-xs text-on-surface-variant/70">
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
                <Menu.Separator className="my-1.5 h-px bg-border" />
                <Menu.Item
                  onClick={logout}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-base text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10"
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
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-base text-on-surface outline-none transition-colors hover:bg-white/5 hover:text-accent-cyan"
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
