"use client";

import { useMemo } from "react";

import { Avatar } from "@/components/dashboard/avatar";
import { leaveTypeLabels, type LeaveRequest, type Personnel } from "@/lib/data/types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 30) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

const statusVerb = {
  pending: "talep etti",
  approved: "onaylandı",
  rejected: "reddedildi",
} as const;

export function RecentActivity({
  requests,
  personnel,
}: {
  requests: LeaveRequest[];
  personnel: Personnel[];
}) {
  const activities = useMemo(() => {
    const byId = new Map(personnel.map((p) => [p.id, p]));
    // Onay/red olayı, oluşturulma değil karar zamanına göre öne çıksın.
    const eventTime = (r: (typeof requests)[number]) =>
      r.status === "pending" ? r.createdAt : r.decidedAt ?? r.createdAt;
    return [...requests]
      .sort(
        (a, b) => new Date(eventTime(b)).getTime() - new Date(eventTime(a)).getTime()
      )
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        actor: byId.get(r.personnelId)?.name ?? "Bilinmeyen",
        avatarUrl: byId.get(r.personnelId)?.avatarUrl,
        type: r.type,
        status: r.status,
        time: relativeTime(eventTime(r)),
      }));
  }, [requests, personnel]);

  return (
    <div className="flex h-[340px] flex-col rounded-xl border border-slate-200 bg-white md:h-[400px]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-slate-900">Son Aktiviteler</h3>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">
            Henüz etkinlik yok
          </p>
        </div>
      ) : (
        <ul className="custom-scrollbar flex-1 space-y-0 overflow-y-auto">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex gap-3 border-b border-slate-100 px-5 py-3 transition-colors hover:bg-slate-50 last:border-0 md:px-6"
            >
              <Avatar
                name={activity.actor}
                url={activity.avatarUrl}
                className="size-8 shrink-0 rounded-full"
              />
              <div>
                <p className="text-sm leading-snug text-slate-800">
                  <span className="font-semibold">{activity.actor}</span>{" "}
                  <span className="text-[#7b1e2b] font-medium">
                    {leaveTypeLabels[activity.type]}
                  </span>{" "}
                  {statusVerb[activity.status]}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {activity.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
