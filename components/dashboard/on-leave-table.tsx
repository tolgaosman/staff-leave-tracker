"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/dashboard/avatar";
import { AttachmentDialog } from "@/components/dashboard/attachment-dialog";
import { MobileCard, MobileCardList } from "@/components/dashboard/mobile-card-list";
import {
  attachmentConfig,
  leaveTypeLabels,
  type LeaveRequest,
  type Personnel,
} from "@/lib/data/types";
import { workingDayCount } from "@/lib/date/business-days";
import { formatDateTR } from "@/lib/format";

/** Bugünün tarihini yerel bileşenlerden "yyyy-mm-dd" üretir (toISOString UTC'ye
    kaydığı için kullanmıyoruz — bkz. lib/date/business-days.ts). */
function todayIso(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${m}-${d}`;
}

export function OnLeaveTable({
  personnel: allPersonnel,
  requests: allRequests,
}: {
  personnel: Personnel[];
  requests: LeaveRequest[];
}) {
  // Doğrudan onaylı izinlerden hesaplanır (p.status'e bağlı değil) → her zaman
  // güncel. Bitmemiş (endDate >= bugün) onaylı izinler; kişi başına aktif izni,
  // yoksa en yakın yaklaşan izni seçilir.
  const rows = useMemo(() => {
    const today = todayIso();
    const personById = new Map(allPersonnel.map((p) => [p.id, p]));

    // personelId → o kişi için seçilen izin
    const chosen = new Map<
      string,
      { leave: (typeof allRequests)[number]; active: boolean }
    >();

    for (const p of allPersonnel) {
      const theirs = allRequests
        .filter(
          (r) =>
            r.personnelId === p.id &&
            r.status === "approved" &&
            r.endDate >= today
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      if (theirs.length === 0) continue;

      const active = theirs.find((r) => r.startDate <= today && r.endDate >= today);
      const pick = active ?? theirs[0]; // theirs sıralı → en yakın yaklaşan
      chosen.set(p.id, { leave: pick, active: Boolean(active) });
    }

    return Array.from(chosen.entries())
      .map(([personnelId, { leave, active }]) => {
        const person = personById.get(personnelId)!;
        return {
          id: person.id,
          name: person.name,
          department: person.department,
          avatarUrl: person.avatarUrl,
          active,
          type: leaveTypeLabels[leave.type],
          leaveType: leave.type,
          note: leave.note?.trim() ? leave.note : "—",
          startDate: leave.startDate,
          endDate: leave.endDate,
          rawStart: leave.startDate,
          daysLeft: workingDayCount(today, leave.endDate),
          attachmentUrl: leave.attachmentUrl,
          attachmentName: leave.attachmentName,
        };
      })
      // Önce aktif olanlar, sonra başlangıç tarihine göre.
      .sort((a, b) =>
        a.active === b.active
          ? a.rawStart.localeCompare(b.rawStart)
          : a.active
          ? -1
          : 1
      );
  }, [allPersonnel, allRequests]);

  if (rows.length === 0) {
    return (
      <div className="glass-panel flex min-h-[180px] flex-col items-center justify-center rounded-xl p-5 text-center md:min-h-[250px] md:p-8">
        <p className="font-sans text-base text-on-surface-variant">
          Şu anda izinde olan veya yaklaşan izni bulunan personel yok.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-xl">
      <div className="border-b border-outline-variant/30 p-4 md:p-6">
        <h3 className="font-serif text-2xl font-bold text-primary">İzindeki Personeller</h3>
        <p className="font-mono text-xs text-on-surface-variant/70 italic mt-1">
          Şu anda izinde olan ve yaklaşan izinli çalışanlar
        </p>
      </div>
      {/* Mobil: kart listesi */}
      <MobileCardList className="p-4">
        {rows.map((r) => (
          <MobileCard
            key={r.id}
            leading={<Avatar name={r.name} url={r.avatarUrl} className="size-10 shrink-0" />}
            title={r.name}
            subtitle={r.department}
            badge={
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-label-mono text-xs ${
                  r.active
                    ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                }`}
              >
                {r.active ? "İzinde" : "Yaklaşan"}
              </span>
            }
            rows={[
              {
                label: "İzin Türü",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block rounded-full border border-outline-variant/30 bg-surface-1 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
                      {r.type}
                    </span>
                    {r.attachmentUrl && (
                      <AttachmentDialog
                        url={r.attachmentUrl}
                        name={r.attachmentName}
                        label={attachmentConfig[r.leaveType]?.label}
                      >
                        <span className="inline-flex items-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold text-accent-cyan">
                          {attachmentConfig[r.leaveType]?.buttonLabel ?? "Belge"}
                        </span>
                      </AttachmentDialog>
                    )}
                  </span>
                ),
              },
              { label: "Gerekçe", value: r.note },
              {
                label: "Tarih",
                value: (
                  <div className="text-xs text-on-surface-variant font-medium">
                    {formatDateTR(r.startDate)} – {formatDateTR(r.endDate)}
                  </div>
                ),
              },
              {
                label: "Dönmeye Kalan",
                value: (
                  <span className="font-bold text-secondary">
                    {r.daysLeft > 0 ? `${r.daysLeft} iş günü` : "Bugün dönüyor"}
                  </span>
                ),
              },
            ]}
          />
        ))}
      </MobileCardList>

      {/* Masaüstü: tablo */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/20 font-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
              <th className="px-6 py-4 font-bold">Personel</th>
              <th className="px-6 py-4 font-bold">Durum</th>
              <th className="px-6 py-4 font-bold">İzin Türü</th>
              <th className="px-6 py-4 font-bold">Gerekçe</th>
              <th className="px-6 py-4 font-bold">Başlangıç–Bitiş</th>
              <th className="px-6 py-4 font-bold text-right">Dönmeye Kalan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-outline-variant/10 transition-colors hover:bg-white/40 last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} url={r.avatarUrl} className="size-9 shrink-0" />
                    <div>
                      <div className="font-bold text-primary">{r.name}</div>
                      <div className="text-xs text-on-surface-variant/70">{r.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-label-mono text-xs ${
                      r.active
                        ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {r.active ? "İzinde" : "Yaklaşan"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full border border-outline-variant/30 px-3 py-1 font-mono text-[10px] font-semibold bg-surface-1 text-accent-cyan uppercase tracking-wider">
                      {r.type}
                    </span>
                    {r.attachmentUrl && (
                      <AttachmentDialog
                        url={r.attachmentUrl}
                        name={r.attachmentName}
                        label={attachmentConfig[r.leaveType]?.label}
                      >
                        <span
                          className="inline-flex items-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold text-accent-cyan hover:bg-accent-cyan/20 cursor-pointer"
                          title={attachmentConfig[r.leaveType]?.label ?? "Belge"}
                        >
                          {attachmentConfig[r.leaveType]?.buttonLabel ?? "Belge"}
                        </span>
                      </AttachmentDialog>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-[220px] truncate text-on-surface-variant font-sans text-sm" title={r.note}>
                  {r.note}
                </td>
                <td className="px-6 py-4">
                  <div className="text-[11px] text-on-surface-variant/80 font-medium whitespace-nowrap hidden sm:block">
                    {formatDateTR(r.startDate)} – {formatDateTR(r.endDate)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-secondary">
                    {r.daysLeft > 0 ? `${r.daysLeft} iş günü` : "Bugün dönüyor"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
