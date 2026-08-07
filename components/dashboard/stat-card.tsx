import { type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type StatAccent = "cyan" | "violet" | "neutral";

export type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: StatAccent;
  /** e.g. "+12%" shown with a trending-up glyph */
  trend?: string;
  /** small caption after the trend or on its own */
  caption?: string;
  /** label for the pill CTA (renders instead of trend/caption) */
  action?: string;
  /** when set with `action`, the pill navigates here */
  actionHref?: string;
  /** applies the glowing highlighted treatment (the "Pending" card) */
  highlight?: boolean;
  /** override the color of the value text (e.g. 'text-destructive') */
  valueColor?: string;
};

const accentStripe: Record<StatAccent, string> = {
  cyan: "bg-[#7b1e2b]",
  violet: "bg-[#9e5561]",
  neutral: "bg-slate-400",
};

const accentIcon: Record<StatAccent, string> = {
  cyan: "text-[#7b1e2b]",
  violet: "text-[#9e5561]",
  neutral: "text-slate-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  caption,
  action,
  actionHref,
  highlight,
  valueColor,
}: Stat) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
        highlight && "border-red-200 bg-red-50/30"
      )}
    >
      {/* Left accent stripe */}
      <div className={cn("w-1 shrink-0", highlight ? "bg-red-500" : accentStripe[accent])} />

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </span>
          <Icon className={cn("mt-0.5 size-4 shrink-0", highlight ? "text-red-400" : accentIcon[accent])} />
        </div>

        {/* Value */}
        <div
          className={cn(
            "text-3xl font-bold tracking-tight text-slate-900 md:text-4xl",
            valueColor ? valueColor : highlight ? "text-red-600" : ""
          )}
        >
          {value.padStart(2, "0")}
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <div className="text-xs text-slate-400">
            {highlight ? "Onay Bekleyenler" : (caption || "Toplam Personel")}
          </div>

          {action && actionHref && (
            <Link
              href={actionHref}
              className="group/btn flex items-center gap-1 text-xs font-semibold text-[#7b1e2b] hover:text-[#5a1622]"
            >
              <span>{action}</span>
              <span className="transition-transform group-hover/btn:translate-x-0.5">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
