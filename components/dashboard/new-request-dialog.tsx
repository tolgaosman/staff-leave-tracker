"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useCurrentEmployee } from "@/components/auth/use-current-employee";
import { useIsAdmin } from "@/components/auth/role-store";
import { LeaveDialog } from "@/components/dashboard/leave-dialog";
import { Button } from "@/components/ui/button";

/* Sidebar "New Request" entry point — opens the shared LeaveDialog, which
   persists the request. Admin herkes için; çalışan yalnız kendine (kilitli). */

export function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const { me } = useCurrentEmployee();

  // Çalışan, personel kaydı e-postayla eşleşmiyorsa talep oluşturamaz.
  const disabled = !isAdmin && !me;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Önce e-postanıza ait bir personel kaydı gerekli" : undefined}
        className="h-auto w-full gap-2 bg-accent-cyan px-4 py-3 text-base font-bold text-white shadow-[0_0_20px_rgba(123,30,43,0.25)] hover:bg-accent-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-5" />
        Yeni Talep
      </Button>

      <LeaveDialog
        open={open}
        onOpenChange={setOpen}
        defaultPersonnelId={isAdmin ? undefined : me?.id}
        lockPersonnel={!isAdmin}
      />
    </>
  );
}
