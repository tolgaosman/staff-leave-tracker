"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarMinus,
  CalendarPlus,
  Hourglass,
  PartyPopper,
  Plane,
  UserRound,
  Wallet,
} from "lucide-react";

import { useCurrentEmployee } from "@/components/auth/use-current-employee";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/dashboard/avatar";
import { LeaveStatusBadge } from "@/components/dashboard/badges";
import { LeaveDialog } from "@/components/dashboard/leave-dialog";
import { LeaveUsageGauge } from "@/components/dashboard/leave-usage-gauge";
import { MobileCard, MobileCardList } from "@/components/dashboard/mobile-card-list";
import { ViewReasonDialog } from "@/components/dashboard/view-reason-dialog";
import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { computeLeaveBalance } from "@/lib/data/balance";
import { leaveTypeLabels, type LeaveRequest, type LeaveType } from "@/lib/data/types";
import { publicHolidays2026 } from "@/lib/date/holidays";
import { parseLocalDate, workingDayCount } from "@/lib/date/business-days";

function todayIso(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${m}-${d}`;
}

const MS_DAY = 86_400_000;

/** Bugünden verilen ISO tarihe kadar takvim günü farkı (negatifse geçmiş). */
function calendarDaysUntil(iso: string, today: string): number {
  return Math.round((parseLocalDate(iso).getTime() - parseLocalDate(today).getTime()) / MS_DAY);
}

function fmt(iso: string) {
  return parseLocalDate(iso).toLocaleDateString("tr-TR");
}

function tenureYears(startDate?: string): number {
  if (!startDate) return 0;
  const start = parseLocalDate(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  const ms = Date.now() - start;
  return ms > 0 ? Math.floor(ms / (365.25 * MS_DAY)) : 0;
}

/** Ham API izin satırını domain `LeaveRequest`'e çevirir. */
function mapLeave(it: any, personnelId: string): LeaveRequest {
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
  };
}

/* Genel bilgi — kimliğe bağlı değil; her iki durumda da gösterilir. */
function UpcomingHolidays() {
  const today = todayIso();
  const items = useMemo(
    () =>
      publicHolidays2026
        .filter((h) => h.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [today]
  );

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl p-5 md:p-8">
      <div className="mb-5 flex items-center gap-2">
        <PartyPopper className="size-5 text-accent-violet" />
        <h3 className="font-serif text-2xl font-bold text-primary">Yaklaşan Resmî Tatiller</h3>
      </div>
      {items.length === 0 ? (
        <p className="font-sans text-sm text-on-surface-variant">
          Bu yıl için planlı resmî tatil kalmadı.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => {
            const left = calendarDaysUntil(h.date, today);
            const weekday = parseLocalDate(h.date).toLocaleDateString("tr-TR", { weekday: "long" });
            return (
              <li
                key={h.date}
                className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/20 bg-surface-1 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-semibold text-on-surface">{h.name}</p>
                  <p className="font-mono text-xs text-on-surface-variant/70 capitalize">
                    {fmt(h.date)} · {weekday}
                  </p>
                </div>
                <span className="shrink-0 font-label-mono text-xs font-bold text-accent-violet">
                  {left === 0 ? "Bugün" : `${left} gün`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { me, loading: meLoading } = useCurrentEmployee();
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);

  const today = todayIso();

  // "Ben"in izinleri: GET /personnel/:id yanıtı izin geçmişini de taşır.
  const fetchMyLeaves = useCallback(() => {
    if (!me) return;
    apiFetch<any>(`/personnel/${me.id}`)
      .then((d) => {
        const leaves: LeaveRequest[] = (d.leave_requests ?? []).map((it: any) =>
          mapLeave(it, me.id)
        );
        setMyLeaves(leaves);
      })
      .catch(() => setMyLeaves([]));
  }, [me]);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  // Bakiye artık store yerine API izinlerinden türetilir.
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

  // Onaylı izinlerden: bugünü kapsayan (aktif) ya da en yakın gelecek.
  const activeOrUpcoming = useMemo(() => {
    const approved = myLeaves
      .filter((l) => l.status === "approved" && l.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const active = approved.find((l) => l.startDate <= today && l.endDate >= today);
    return { leave: active ?? approved[0], active: Boolean(active) };
  }, [myLeaves, today]);

  // ── "Ben" kaydı henüz yükleniyor ──
  if (meLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="font-sans text-sm text-on-surface-variant">Yükleniyor…</p>
      </div>
    );
  }

  // ── Eşleşen personel kaydı yoksa ──
  if (!me) {
    return (
      <>
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">Kişisel Panelim</h2>
        </div>
        <div className="mb-8 flex items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <UserRound className="mt-0.5 size-6 shrink-0 text-amber-600" />
          <div>
            <p className="font-sans text-base font-bold text-on-surface">
              Personel kaydınız bulunamadı
            </p>
            <p className="mt-1 font-sans text-sm text-on-surface-variant">
              <span className="font-mono">{user?.email ?? "—"}</span> e-postasına ait bir personel
              kaydı yok. Verilerinizin görünmesi için yöneticinin sizi bu e-posta ile personel
              listesine eklemesi gerekir.
            </p>
          </div>
        </div>
        <div className="max-w-xl">
          <UpcomingHolidays />
        </div>
      </>
    );
  }

  const years = tenureYears(me.startDate);
  const usedPct =
    balance && balance.entitled > 0
      ? Math.min(100, Math.round((balance.used / balance.entitled) * 100))
      : 0;

  const statusChip = activeOrUpcoming.leave
    ? activeOrUpcoming.active
      ? { text: "İzinde", cls: "border-accent-violet/30 bg-accent-violet/10 text-accent-violet" }
      : { text: "Yaklaşan izni var", cls: "border-amber-500/30 bg-amber-500/10 text-amber-600" }
    : { text: "Aktif", cls: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan" };

  const balanceStats: Stat[] = [
    { label: "HAK EDİLEN", value: String(balance?.entitled ?? 0), icon: CalendarCheck, accent: "cyan", caption: "Kıdeme göre yıllık" },
    { label: "KULLANILAN", value: String(balance?.used ?? 0), icon: CalendarMinus, accent: "violet", caption: "Onaylı yıllık izin", valueColor: "text-primary" },
    { label: "KULLANILABİLİR YILLIK İZİN", value: String(balance?.remaining ?? 0), icon: Wallet, accent: "cyan", caption: "Kalan bakiye", valueColor: "text-primary" },
    { label: "ONAY BEKLEYEN", value: String(balance?.pending ?? 0), icon: Hourglass, accent: "neutral", caption: "Bekleyen yıllık talep", valueColor: "text-primary" },
  ];

  return (
    <>
      {/* Hero */}
      <div className="mb-8 flex flex-col items-stretch gap-4 border-b border-outline-variant/20 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 sm:pl-4">
          <Avatar name={me.name} url={user?.avatarUrl || me.avatarUrl} className="size-12 shrink-0 border border-accent-cyan/30 text-lg sm:size-16" />
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">Merhaba, {me.name} 👋</h2>
            <p className="mt-1 font-sans text-sm text-on-surface-variant md:text-base">
              {me.department}
              {years > 0 && <span> · {years} yıllık kıdem</span>}
              <span
                className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 font-label-mono text-xs ${statusChip.cls}`}
              >
                {statusChip.text}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setRequestOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-base font-bold text-white dark:text-black shadow transition-all hover:bg-accent-cyan/90 active:scale-95 cursor-pointer"
        >
          <CalendarPlus className="size-5" />
          Yeni İzin Talebi
        </button>
      </div>

      {/* İzin bakiyem */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {balanceStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Yıllık kullanım çubuğu + Yaklaşan iznim */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeaveUsageGauge
          used={balance?.used ?? 0}
          entitled={balance?.entitled ?? 0}
          remaining={balance?.remaining ?? 0}
          usedPct={usedPct}
        />

        <div className="glass-panel flex flex-col rounded-xl p-5 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Plane className="size-5 text-accent-cyan" />
            <h3 className="font-serif text-2xl font-bold text-primary">Yaklaşan İznim</h3>
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
                  ? `İzindesin · dönüşe ${workingDayCount(today, activeOrUpcoming.leave.endDate)} iş günü`
                  : `${calendarDaysUntil(activeOrUpcoming.leave.startDate, today)} gün sonra başlıyor · ${workingDayCount(
                      activeOrUpcoming.leave.startDate,
                      activeOrUpcoming.leave.endDate
                    )} iş günü`}
              </p>
            </div>
          ) : (
            <p className="font-sans text-sm text-on-surface-variant">
              Planlı (onaylı) iznin bulunmuyor. Yeni bir izin talebi oluşturabilirsin.
            </p>
          )}
        </div>
      </div>

      {/* Taleplerim + Resmî tatiller */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel flex flex-col rounded-xl p-5 lg:col-span-2 md:p-8">
          <h3 className="mb-5 font-serif text-2xl font-bold text-primary">Taleplerim</h3>
          {sortedMyLeaves.length === 0 ? (
            <p className="font-sans text-sm text-on-surface-variant">
              Henüz izin talebin yok.
            </p>
          ) : (
            <>
            {/* Mobil: kart listesi */}
            <MobileCardList>
              {sortedMyLeaves.map((l) => (
                <MobileCard
                  key={l.id}
                  title={leaveTypeLabels[l.type]}
                  badge={
                    <span className="inline-flex items-center gap-2">
                      <LeaveStatusBadge status={l.status} />
                      {l.status === "rejected" && l.rejectionReason && (
                        <ViewReasonDialog reason={l.rejectionReason} />
                      )}
                    </span>
                  }
                  rows={[
                    {
                      label: "Tarih",
                      value: (
                        <span className="font-mono text-xs">
                          {fmt(l.startDate)} – {fmt(l.endDate)}
                        </span>
                      ),
                    },
                    {
                      label: "İş Günü",
                      value: (
                        <span className="font-mono text-xs font-bold text-primary">
                          {workingDayCount(l.startDate, l.endDate)}
                        </span>
                      ),
                    },
                  ]}
                />
              ))}
            </MobileCardList>

            {/* Masaüstü: tablo */}
            <div className="hidden overflow-x-auto md:block">
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
                    <tr key={l.id} className="border-b border-outline-variant/10 font-sans text-sm last:border-0">
                      <td className="py-3 pr-4 font-medium text-primary">{leaveTypeLabels[l.type]}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-on-surface-variant">
                        {fmt(l.startDate)} – {fmt(l.endDate)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs font-bold text-primary">
                        {workingDayCount(l.startDate, l.endDate)}
                      </td>
                      <td className="py-3 flex items-center gap-2">
                        <LeaveStatusBadge status={l.status} />
                        {l.status === "rejected" && l.rejectionReason && (
                          <ViewReasonDialog reason={l.rejectionReason} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <UpcomingHolidays />
      </div>

      <LeaveDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        defaultPersonnelId={me.id}
        lockPersonnel
        onSaved={fetchMyLeaves}
      />
    </>
  );
}
