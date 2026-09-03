"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-bold text-on-surface">
              Talebi Reddet
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-base text-on-surface-variant">
              İzin talebini reddetme gerekçenizi aşağıya yazınız.
            </Dialog.Description>
          </div>
          
          <div className="mt-4">
            <textarea
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-1 p-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-destructive custom-scrollbar"
              rows={4}
              placeholder="Reddetme gerekçesi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Dialog.Close render={<Button variant="outline" />}>
              İptal
            </Dialog.Close>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                onConfirm(reason);
                onOpenChange(false);
                setTimeout(() => setReason(""), 300);
              }}
            >
              Reddet
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
