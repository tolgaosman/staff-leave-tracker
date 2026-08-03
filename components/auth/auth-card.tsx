import type { ReactNode } from "react";

export const authFieldClasses =
  "w-full rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/50 placeholder-on-surface-variant/40";

export const authLabelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

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
    <div className="glass-panel rounded-2xl p-8 shadow-2xl">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/assets/logoLight.png`}
            alt="İzin Takip Sistemi Logo"
            className="h-9 w-9 object-contain"
          />
          <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
        </div>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>

      {children}

      {footer && (
        <div className="mt-6 text-center text-sm text-on-surface-variant">
          {footer}
        </div>
      )}
    </div>
  );
}
