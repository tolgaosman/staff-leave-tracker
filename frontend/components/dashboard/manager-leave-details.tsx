"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarMinus,
  Hourglass,
  Wallet,
  Plane,
} from "lucide-react";

import { useCurrentEmployee } from "@/components/auth/use-current-employee";
import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import { LeaveUsageGauge } from "@/components/dashboard/leave-usage-gauge";
import { LeaveStatusBadge } from "@/components/dashboard/badges";
import { ViewReasonDialog } from "@/components/dashboard/view-reason-dialog";
import { computeLeaveBalance } from "@/lib/data/balance";
import { leaveTypeLabels, type LeaveRequest, type LeaveType } from "@/lib/data/types";
import { parseLocalDate, workingDayCount } from "@/lib/date/business-days";

function fmt(iso: string) {
  return parseLocalDate(iso).toLocaleDateString("tr-TR");
}

function todayIso(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${m}-${d}`;
}

function calendarDaysUntil(iso: string, today: string): number {
  return Math.round((parseLocalDate(iso).getTime() - parseLocalDate(today).getTime()) / 86_400_000);
}

function mapLeave(it: any, personnelId: string): LeaveRequest {
  const decidedByUser = it.decided_by && typeof it.decided_by === "object" ? it.decided_by : (it.decided_by_user && typeof it.decided_by_user === "object" ? it.decided_by_user : undefined);
  return {
    id: String(it.id),
    personnelId,
    type: (it.leave_type?.slug as LeaveType) ?? "annual",
    startDate: it.start_date ? String(it.start_date).slice(0, 10) : "",
    endDate: it.end_date ? String(it.end_date).slice(0, 10) : "",
    status: it.status ?? "pending",
    note: it.note ?? "",
    rejectionReason: it.rejection_reason ?? undefined,
    createdAt: it.created_at ?? "",
    decidedAt: it.decided_at ?? undefined,
    decidedBy: decidedByUser && decidedByUser.name ? {
      id: String(decidedByUser.id),
      name: decidedByUser.name,
      role: decidedByUser.role,
    } : undefined,
    attachmentUrl: it.attachment_url ?? undefined,
    attachmentName: it.attachment_name ?? undefined,
  };
}

export function ManagerLeaveDetails() {
  const { me, rawData, loading } = useCurrentEmployee();

  const myLeaves = useMemo<LeaveRequest[]>(() => {
    if (!me || !rawData || !rawData.personnel) return [];
    return (rawData.personnel.leave_requests ?? []).map((it: any) =>
      mapLeave(it, me.id)
    );
  }, [me, rawData]);

  const balance = useMemo(
    () => (me ? computeLeaveBalance(me, myLeaves) : undefined),
    [me, myLeaves]
  );

  const sortedMyLeaves = useMemo(
    () =>
      [...myLeaves].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [myLeaves]
  );

  const today = todayIso();

  const activeOrUpcoming = useMemo(() => {
    const approved = myLeaves
      .filter((l) => l.status === "approved" && l.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const active = approved.find((l) => l.startDate <= today && l.endDate >= today);
    return { leave: active ?? approved[0], active: Boolean(active) };
  }, [myLeaves, today]);

  if (!me || loading) return null;

  const totalEntitled = (balance?.entitled ?? 0) + (balance?.carriedOver ?? 0);
  const usedDays = balance?.used ?? 0;
  const remainingDays = balance?.remaining ?? 0;
  const usedPct = totalEntitled > 0 ? Math.min(100, Math.round((usedDays / totalEntitled) * 100)) : 0;
  const allPendingCount = myLeaves.filter((l) => l.status === "pending").length;

  const balanceStats: Stat[] = [
    { label: "HAK EDİLEN", value: String(balance?.entitled ?? 0), icon: CalendarCheck, accent: "cyan", caption: "Yıllık hak edilen" },
    { label: "KULLANILABİLİR", value: String(remainingDays), icon: Wallet, accent: "cyan", caption: "Kalan bakiye" },
    { label: "DEVREDEN", value: String(balance?.carriedOver ?? 0), icon: CalendarMinus, accent: "violet", caption: "Geçen yıldan" },
    { label: "ONAY BEKLEYEN", value: String(allPendingCount), icon: Hourglass, accent: "neutral", caption: "Bekleyen talepler" },
  ];

  return (
    <div className="mt-8 space-y-6">


      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {balanceStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeaveUsageGauge
            used={usedDays}
            entitled={totalEntitled}
            remaining={remainingDays}
            usedPct={usedPct}
          />
        </div>

        <div className="glass-panel flex flex-col rounded-xl p-5 md:p-8 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Plane className="size-5 text-accent-cyan" />
            <h3 className="font-serif text-2xl font-bold text-primary">Yaklaşan İzniniz</h3>
          </div>
          {activeOrUpcoming.leave ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-sans text-lg font-bold text-on-surface">
                  {leaveTypeLabels[activeOrUpcoming.leave.type]}
                </span>
                <LeaveStatusBadge status={activeOrUpcoming.leave.status} />
              </div>
              <p className="font-mono text-sm text-on-surface-variant">
                {fmt(activeOrUpcoming.leave.startDate)} – {fmt(activeOrUpcoming.leave.endDate)}
              </p>
              <p className="font-label-mono text-sm font-bold text-accent-cyan">
                {activeOrUpcoming.active
                  ? `İzindesiniz · dönüşe ${workingDayCount(today, activeOrUpcoming.leave.endDate)} iş günü`
                  : `${calendarDaysUntil(activeOrUpcoming.leave.startDate, today)} gün sonra başlıyor · ${workingDayCount(
                    activeOrUpcoming.leave.startDate,
                    activeOrUpcoming.leave.endDate
                  )} iş günü`}
              </p>
            </div>
          ) : (
            <p className="font-sans text-sm text-on-surface-variant">
              Planlı (onaylı) izniniz bulunmuyor. Yeni izin taleplerini menüden oluşturabilirsiniz.
            </p>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 md:p-8">
        <h3 className="mb-5 font-serif text-2xl font-bold text-primary">Talepleriniz</h3>
        {sortedMyLeaves.length === 0 ? (
          <p className="font-sans text-sm text-on-surface-variant">
            Henüz izin talebiniz yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 font-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
                  <th className="w-[25%] py-3 pr-4 font-bold">İzin Türü</th>
                  <th className="w-[30%] py-3 pr-4 font-bold">Tarih Aralığı</th>
                  <th className="w-[15%] py-3 pr-4 font-bold">İş Günü</th>
                  <th className="w-[30%] py-3 font-bold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {sortedMyLeaves.map((l) => (
                  <tr key={l.id} className="border-b border-outline-variant/10 font-sans text-sm last:border-0 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4 font-medium text-primary">
                      <div className="flex items-center gap-2">
                        <span>{leaveTypeLabels[l.type]}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-on-surface-variant">
                      {fmt(l.startDate)} – {fmt(l.endDate)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs font-bold text-primary">
                      {workingDayCount(l.startDate, l.endDate)}
                    </td>
                    <td className="py-3 flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <LeaveStatusBadge status={l.status} />
                        {l.status === "rejected" && l.rejectionReason && (
                          <ViewReasonDialog reason={l.rejectionReason} decidedBy={l.decidedBy} />
                        )}
                      </div>
                      {l.status === "approved" && l.decidedBy?.name && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Onaylayan: {l.decidedBy.name}
                        </span>
                      )}
                      {l.status === "rejected" && l.decidedBy?.name && (
                        <span className="text-[11px] font-semibold text-rose-700">
                          Reddeden: {l.decidedBy.name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
