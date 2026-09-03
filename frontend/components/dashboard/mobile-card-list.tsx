import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* md altında tabloların yerini alan kart listesi.
   Tablolar `hidden md:block` ile gizlenir, aynı veri buraya maplenir. */

export function MobileCardList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3 md:hidden", className)}>{children}</ul>
  );
}

export type MobileCardRow = {
  label: string;
  value: ReactNode;
};

export function MobileCard({
  title,
  subtitle,
  leading,
  badge,
  rows,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Başlığın solundaki görsel (ör. Avatar). */
  leading?: ReactNode;
  /** Başlığın sağındaki rozet (ör. durum). */
  badge?: ReactNode;
  rows: MobileCardRow[];
  actions?: ReactNode;
}) {
  return (
    // bg-surface-2: hem sayfa zemininde hem de bir glass-panel içinde iç içe
    // kullanıldığında ayırt edilebilir kalır.
    <li className="rounded-xl border border-outline-variant/25 bg-surface-2/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <div className="truncate font-sans text-base font-bold text-primary">
              {title}
            </div>
            {subtitle && (
              <div className="truncate font-sans text-xs text-on-surface-variant/70">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {rows.length > 0 && (
        <dl className="mt-3 space-y-1.5 border-t border-outline-variant/15 pt-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 font-label-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70">
                {row.label}
              </dt>
              <dd className="min-w-0 text-right font-sans text-sm text-on-surface">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-outline-variant/15 pt-3">
          {actions}
        </div>
      )}
    </li>
  );
}
