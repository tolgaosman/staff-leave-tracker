"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViewReasonDialog({
  reason,
  decidedBy,
}: {
  reason: string;
  decidedBy?: { name: string; role?: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-label-mono text-xs font-bold text-destructive transition-colors hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive/40 outline-none cursor-pointer">
        <Info className="size-3.5" />
        Gerekçe
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Info className="size-6" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-bold text-on-surface">
              Reddetme Gerekçesi
            </Dialog.Title>
            {decidedBy?.name && (
              <span className="mt-2 text-xs font-semibold text-destructive/90 bg-destructive/10 px-2.5 py-0.5 rounded-full">
                Reddeden: {decidedBy.name}
              </span>
            )}
          </div>
          
          <div className="mt-4 rounded-lg border border-outline-variant/30 bg-surface-1 p-4 text-sm text-on-surface text-center italic">
            &quot;{reason}&quot;
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Dialog.Close render={<Button variant="outline" />}>
              Kapat
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
