"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { Avatar } from "@/components/dashboard/avatar";
import { LeaveStatusBadge } from "@/components/dashboard/badges";
import {
  leaveTypeLabels,
  type LeaveRequest,
  type Personnel,
} from "@/lib/data/types";
import { workingDayCount } from "@/lib/date/business-days";

export type CalendarDayEntry = { leave: LeaveRequest; person: Personnel };

/** Bugünün tarihini yerel bileşenlerden "yyyy-mm-dd" üretir (toISOString UTC'ye
    kaydığı için kullanmıyoruz — bkz. lib/date/business-days.ts). */
function todayIso(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${m}-${d}`;
}

const labelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

/* Takvimde izinli bir güne tıklanınca açılan detay penceresi: o gün izinde olan
   her personel için izin sebebi, açıklaması ve (bugünden bitişe) kalan iş günü. */
export function CalendarDayDialog({
  open,
  onOpenChange,
  dateIso,
  entries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateIso: string | null;
  entries: CalendarDayEntry[];
}) {
  const today = todayIso();
  const titleDate = dateIso
    ? new Date(dateIso + "T00:00:00").toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold capitalize text-on-surface">
                {titleDate}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                Bugün izinli olan personel
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Kapat"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-black/5 cursor-pointer"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <ul className="custom-scrollbar mt-5 space-y-3 overflow-y-auto pr-1">
            {entries.map(({ leave, person }) => {
              const remaining = workingDayCount(today, leave.endDate);
              return (
                <li
                  key={leave.id}
                  className="rounded-xl border border-outline-variant/20 bg-surface-1 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={person.name} url={person.avatarUrl} className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-primary">{person.name}</div>
                      <div className="text-xs text-on-surface-variant/70">
                        {person.department}
                      </div>
                    </div>
                    <LeaveStatusBadge status={leave.status} />
                  </div>

                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className={labelClasses}>İzin Sebebi</dt>
                      <dd className="font-medium text-on-surface">
                        {leaveTypeLabels[leave.type]}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className={labelClasses}>Açıklama</dt>
                      <dd className="max-w-[60%] text-right text-on-surface">
                        {leave.note?.trim() ? leave.note : "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className={labelClasses}>İzin Süresi</dt>
                      <dd className="font-bold text-secondary">
                        {workingDayCount(leave.startDate, leave.endDate)} iş günü
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
