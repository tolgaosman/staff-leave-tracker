"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHasDashboardAccess } from "@/components/auth/role-store";
import { isNavItemActive, navItems } from "@/components/dashboard/nav-items";
import { NewRequestDialog } from "@/components/dashboard/new-request-dialog";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";

import { UserMenu } from "@/components/dashboard/user-menu";
import { cn } from "@/lib/utils";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Tema-duyarlı logo ikilisi (sidebar'daki desenin aynısı). */
function LogoImages() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/assets/logoDark.png`}
        alt="İzin Takip Sistemi Logo"
        className="h-8 w-8 object-contain"
      />
    </>
  );
}

function BrandText({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "truncate font-serif text-base font-bold leading-tight text-primary",
        className
      )}
    >
      İzin Takip
    </span>
  );
}

/* Mobil (md altı) üst bar. Sidebar ve TopNav md altında gizli olduğu için
   gezinme, tema ve profil menüsüne erişimin tek yolu burasıdır. */
export function MobileTopBar() {
  const pathname = usePathname();
  const hasAccess = useHasDashboardAccess();
  const [open, setOpen] = useState(false);

  const visibleItems = navItems.filter((item) => hasAccess || !item.adminOnly);
  // Tek öğe kaldığında (çalışan rolü) çekmeceye gerek yok.
  const showDrawer = visibleItems.length > 1;

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-outline-variant/20 bg-background/85 px-3 backdrop-blur md:hidden">
      <div className="flex min-w-0 items-center gap-1">
        {showDrawer && (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Menüyü aç"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary active:scale-95"
            >
              <MenuIcon className="size-5" />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
              <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-outline-variant/30 bg-sidebar p-5 shadow-2xl outline-none transition-transform duration-300 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full">
                <div className="mb-8 flex items-center justify-between gap-2">
                  <Dialog.Title className="flex min-w-0 items-center gap-2">
                    <LogoImages />
                    <BrandText />
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Menüyü kapat"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary active:scale-95"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>

                <nav className="flex-1 space-y-1">
                  {visibleItems.map(({ label, icon: Icon, href }) => {
                    const active = isNavItemActive(pathname, href);
                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors active:scale-[0.98]",
                          active
                            ? "bg-sidebar-accent font-bold text-primary"
                            : "text-on-surface-variant hover:bg-black/5 hover:text-primary"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="font-sans text-base">{label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {!hasAccess && (
                  <div className="mt-auto border-t border-outline-variant/30 pt-5">
                    <NewRequestDialog />
                  </div>
                )}
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Hamburger varken metin yer kaplamasın diye yalnızca logo gösterilir. */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 transition-opacity active:opacity-70"
          aria-label="Genel Bakış"
        >
          <LogoImages />
          {!showDrawer && <BrandText />}
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <RoleSwitcher />

        <UserMenu />
      </div>
    </header>
  );
}
