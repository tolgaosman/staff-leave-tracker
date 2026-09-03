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
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/assets/siteLogo.png`}
        alt="İzin Takip Sistemi Logo"
        className="h-8 w-8 shrink-0 object-contain"
      />
    </>
  );
}

function BrandText({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "truncate text-sm font-semibold leading-tight text-slate-900 tracking-tight",
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
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 md:hidden">
      <div className="flex min-w-0 items-center gap-1">
        {showDrawer && (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Menüyü aç"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              <MenuIcon className="size-5" />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
              <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#0F172A] p-5 shadow-2xl outline-none transition-transform duration-300 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full">
                <div className="mb-8 flex items-center justify-between gap-2">
                  <Dialog.Title className="flex min-w-0 items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#7b1e2b]">
                      <img
                        src={`${basePath}/assets/siteLogo.png`}
                        alt="İzin Takip"
                        className="h-4 w-4 object-contain brightness-0 invert"
                      />
                    </div>
                    <span className="text-sm font-semibold text-white tracking-tight">İzin Takip</span>
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Menüyü kapat"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
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
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors active:scale-[0.98]",
                          active
                            ? "bg-[#7b1e2b] font-medium text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {!hasAccess && (
                  <div className="mt-auto border-t border-white/8 pt-4">
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
