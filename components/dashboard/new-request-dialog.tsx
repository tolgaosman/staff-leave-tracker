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
        className="h-auto w-full gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5a1622] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        <Plus className="size-4" />
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
