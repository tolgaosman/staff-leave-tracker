"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { apiFetch } from "@/lib/api";

export type ConflictEntry = {
  id: number;
  personnel_name: string;
  start_date: string;
  end_date: string;
  status: "approved" | "pending";
};

type Props = {
  leaveRequestId: string | number;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
};

/**
 * Onaylamadan önce aynı departmandaki çakışan izinleri gösterir.
 * Çakışma yoksa direkt onConfirm() çağırır (dialog açılmaz).
 */
export function ConflictWarningDialog({ leaveRequestId, onConfirm, onCancel, open }: Props) {
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!open) {
      calledRef.current = false;
      return;
    }
    setLoading(true);
    calledRef.current = false;
    apiFetch<ConflictEntry[]>(`/leave-requests/${leaveRequestId}/conflicts`)
      .then((data) => {
        setConflicts(data);
        if (data.length === 0 && !calledRef.current) {
          calledRef.current = true;
          onConfirm();
        }
      })
      .catch(() => {
        setConflicts([]);
        if (!calledRef.current) {
          calledRef.current = true;
          onConfirm();
        }
      })
      .finally(() => setLoading(false));
  }, [open, leaveRequestId]);

  if (!open || loading || conflicts.length === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-white/10 bg-surface-1 p-6 shadow-2xl outline-none">
          <div className="absolute right-4 top-4">
            <Dialog.Close
              onClick={onCancel}
              className="rounded-full p-1.5 text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {/* Icon */}
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <AlertTriangle className="size-8" />
          </div>

          <Dialog.Title className="mb-1 text-xl font-bold text-on-surface">
            Takvim Çakışması!
          </Dialog.Title>
          <p className="mb-4 text-sm text-on-surface-variant">
            Bu izin aynı dönemde aşağıdaki departman arkadaşlarıyla çakışıyor. Yine de onaylamak istiyor musunuz?
          </p>

          {/* Conflict list */}
          <ul className="mb-5 space-y-2">
            {conflicts.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                <span className="font-semibold text-sm text-on-surface">{c.personnel_name}</span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {new Date(c.start_date).toLocaleDateString("tr-TR")} – {new Date(c.end_date).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl bg-surface-2 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-3 active:scale-95 transition-all"
            >
              Vazgeç
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-500/90 active:scale-95 transition-all"
            >
              Yine de Onayla
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
