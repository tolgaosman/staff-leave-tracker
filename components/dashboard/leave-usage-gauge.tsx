"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";

/* ── Theme-aware colors ── */
const LIGHT = {
  gradStart: "#7b1e2b",
  gradEnd: "#b84456",
  track: "#f3e7e9",
  trackBorder: "rgba(123,30,43,0.08)",
  labelText: "#6e4a50",
  chipBg: "rgba(123,30,43,0.06)",
  chipBorder: "rgba(123,30,43,0.12)",
  chipText: "#7b1e2b",
  dotActive: "#7b1e2b",
  dotInactive: "#e8d0d4",
};

const DARK = {
  gradStart: "#ff99a8",
  gradEnd: "#ff6b81",
  track: "#3f3f46",
  trackBorder: "rgba(255,255,255,0.06)",
  labelText: "#a1a1aa",
  chipBg: "rgba(255,153,168,0.08)",
  chipBorder: "rgba(255,153,168,0.15)",
  chipText: "#ff99a8",
  dotActive: "#ff99a8",
  dotInactive: "#52525b",
};

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

type LeaveUsageGaugeProps = {
  used: number;
  entitled: number;
  remaining: number;
  usedPct: number;
};

export function LeaveUsageGauge({
  used,
  entitled,
  remaining,
  usedPct,
}: LeaveUsageGaugeProps) {
  const isDark = useIsDark();
  const c = isDark ? DARK : LIGHT;

  const data = [{ name: "Kullanım", value: usedPct, max: 100 }];

  /* Milestone dots at 25%, 50%, 75% */
  const milestones = [25, 50, 75];

  return (
    <div className="glass-panel flex flex-col rounded-xl p-5 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-2xl font-bold text-primary">
          Yıllık İzin Kullanımı
        </h3>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-bold"
          style={{
            background: c.chipBg,
            border: `1px solid ${c.chipBorder}`,
            color: c.chipText,
          }}
        >
          {used} / {entitled} gün
        </span>
      </div>
      <p className="font-mono text-xs italic text-on-surface-variant/60 mb-6">
        Onaylanan yıllık izin bakiyesi
      </p>

      {/* Recharts horizontal progress bar */}
      <div className="w-full h-[44px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            /* Sağdaki 40px, kaldırılan yüzde etiketi içindi; çubuk artık tam
               genişlikte. Aşağıdaki kilometre taşı noktalarının hizası bu
               margin'e bağlı — ikisi birlikte değiştirilmeli. */
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barCategoryGap={0}
          >
            <defs>
              <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c.gradStart} stopOpacity={1} />
                <stop offset="100%" stopColor={c.gradEnd} stopOpacity={0.85} />
              </linearGradient>
              <clipPath id="roundedBar">
                <rect x="0" y="6" width="100%" height="32" rx="16" ry="16" />
              </clipPath>
            </defs>
            <XAxis
              type="number"
              domain={[0, 100]}
              hide
            />
            {/* Background track bar */}
            <Bar
              dataKey="max"
              fill={c.track}
              radius={[16, 16, 16, 16]}
              barSize={32}
              isAnimationActive={false}
            />
            {/* Active progress bar */}
            <Bar
              dataKey="value"
              radius={[16, 16, 16, 16]}
              barSize={32}
              animationDuration={900}
              animationEasing="ease-out"
            >
              <Cell fill="url(#progressGrad)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Milestone dots overlaid */}
        <div className="absolute inset-0 pointer-events-none flex items-center" style={{ left: 0, right: 0 }}>
          {milestones.map((m) => (
            <div
              key={m}
              className="absolute w-2 h-2 rounded-full transition-colors duration-500"
              style={{
                left: `${m}%`,
                transform: "translateX(-50%)",
                background: usedPct >= m ? c.dotActive : c.dotInactive,
                boxShadow: usedPct >= m ? `0 0 6px ${c.dotActive}40` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: c.gradStart }}
          />
          <span className="font-sans text-xs" style={{ color: c.labelText }}>
            {used} gün kullanıldı
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: c.track, border: `1px solid ${c.trackBorder}` }}
          />
          <span className="font-sans text-xs" style={{ color: c.labelText }}>
            {remaining} gün kaldı
          </span>
        </div>
      </div>
    </div>
  );
}
