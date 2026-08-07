import type { ReactNode } from "react";

export const authFieldClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10 placeholder-slate-400";

export const authLabelClasses =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-2 flex flex-col items-center text-center">
        <img
          src={`${basePath}/assets/siteLogo.png`}
          alt="İzin Takip Sistemi Logo"
          className="h-14 w-auto object-contain"
        />
      </div>

      {children}

      {footer && (
        <div className="mt-6 text-center text-sm text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
