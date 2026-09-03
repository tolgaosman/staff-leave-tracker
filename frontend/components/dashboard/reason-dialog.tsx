"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Info, X, AlertCircle } from "lucide-react";
import { useState } from "react";

export function ReasonDialog({
  reason,
  decidedBy,
}: {
  reason: string;
  decidedBy?: { name: string; role?: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-destructive/10 p-1 text-destructive hover:bg-destructive/20 active:scale-95 ml-2 transition-colors cursor-pointer"
        title="Ret Gerekçesini Gör"
      >
        <Info className="size-4" />
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-white/10 bg-surface-1 p-8 shadow-2xl outline-none">
            <div className="absolute right-4 top-4">
              <Dialog.Close className="rounded-full p-1.5 text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors cursor-pointer">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
              <AlertCircle className="size-8" />
            </div>
            
            <Dialog.Title className="mb-1 text-center text-xl font-bold text-on-surface">
              İzin Reddedildi
            </Dialog.Title>

            {decidedBy?.name && (
              <span className="mb-5 text-xs font-semibold text-destructive/90 bg-destructive/10 px-2.5 py-0.5 rounded-full">
                Reddeden: {decidedBy.name}
              </span>
            )}
            
            <div className="w-full rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="font-medium text-destructive leading-relaxed">
                "{reason}"
              </p>
            </div>

            <Dialog.Close className="mt-8 w-full rounded-xl bg-surface-2 px-4 py-3 font-bold text-on-surface transition-all hover:bg-surface-3 active:scale-95 cursor-pointer">
              Anladım
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
