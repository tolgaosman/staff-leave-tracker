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
      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center md:min-h-[250px]">
        <p className="text-sm text-slate-400">
          Şu anda izinde olan veya yaklaşan izni bulunan personel yok.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">İzindeki Personeller</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Şu anda izinde olan ve yaklaşan izinli çalışanlar
          </p>
        </div>
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
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                  r.active
                    ? "bg-[#f9eced] text-[#7b1e2b] ring-1 ring-[#e8c5ca]"
                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
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
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {r.type}
                    </span>
                    {r.attachmentUrl && (
                      <AttachmentDialog
                        url={r.attachmentUrl}
                        name={r.attachmentName}
                        label={attachmentConfig[r.leaveType]?.label}
                      >
                        <span className="inline-flex items-center rounded-md bg-[#f9eced] px-2 py-0.5 text-[10px] font-semibold text-[#7b1e2b] hover:bg-[#f0d4d7] cursor-pointer">
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
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Personel</th>
              <th className="px-6 py-3">Durum</th>
              <th className="px-6 py-3">İzin Türü</th>
              <th className="px-6 py-3">Gerekçe</th>
              <th className="px-6 py-3">Başlangıç–Bitiş</th>
              <th className="px-6 py-3 text-right">Dönmeye Kalan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} url={r.avatarUrl} className="size-8 shrink-0 rounded-full" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-400">{r.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                      r.active
                        ? "bg-[#f9eced] text-[#7b1e2b] ring-1 ring-[#e8c5ca]"
                        : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {r.active ? "İzinde" : "Yaklaşan"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {r.type}
                    </span>
                    {r.attachmentUrl && (
                      <AttachmentDialog
                        url={r.attachmentUrl}
                        name={r.attachmentName}
                        label={attachmentConfig[r.leaveType]?.label}
                      >
                        <span
                          className="inline-flex items-center rounded-md bg-[#f9eced] px-2 py-0.5 text-[10px] font-semibold text-[#7b1e2b] hover:bg-[#f0d4d7] cursor-pointer"
                          title={attachmentConfig[r.leaveType]?.label ?? "Belge"}
                        >
                          {attachmentConfig[r.leaveType]?.buttonLabel ?? "Belge"}
                        </span>
                      </AttachmentDialog>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-[220px] truncate text-sm text-slate-500" title={r.note}>
                  {r.note}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTR(r.startDate)} – {formatDateTR(r.endDate)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-slate-700">
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
