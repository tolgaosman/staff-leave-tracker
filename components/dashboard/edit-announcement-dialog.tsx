"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import { apiFetch } from "@/lib/api";
import { useRole } from "@/components/auth/role-store";
import type { Announcement } from "@/components/dashboard/announcements-panel";

const fieldClasses =
  "w-full rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/50 placeholder-on-surface-variant/40";

const labelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

function EditAnnouncementForm({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const role = useRole();
  const canSelectDept = role === "super_admin" || role === "hr_admin";

  const [title, setTitle] = useState(announcement.title ?? "");
  const [body, setBody] = useState(announcement.body ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    announcement.department_id ? String(announcement.department_id) : ""
  );
  const [departments, setDepartments] = useState<any[]>([]);

  const initialStart = announcement.start_date ? new Date(announcement.start_date) : null;
  const initialEnd = announcement.expires_at ? new Date(announcement.expires_at) : null;
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    initialStart,
    initialEnd,
  ]);
  const [startDate, expiresAt] = dateRange;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canSelectDept && departments.length === 0) {
      apiFetch<any[]>("/departments")
        .then(setDepartments)
        .catch(() => {});
    }
  }, [canSelectDept, departments.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let finalStartDate: string | null = null;
      if (startDate) {
        finalStartDate = startDate.toISOString();
      }

      let finalExpiresAt: string | null = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        d.setHours(17, 0, 0, 0);
        finalExpiresAt = d.toISOString();
      }

      const payload: any = {
        title,
        body,
        start_date: finalStartDate,
        expires_at: finalExpiresAt,
      };

      if (canSelectDept) {
        payload.department_id = departmentId ? Number(departmentId) : null;
      }

      await apiFetch(`/announcements/${announcement.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success("Duyuru güncellendi");
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Duyuru güncellenemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent-cyan/15 text-accent-cyan">
            <Pencil className="size-4" />
          </div>
          <div>
            <Dialog.Title className="text-2xl font-bold text-on-surface">
              Duyuruyu Düzenle
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
              Duyuru bilgilerini güncelleyin.
            </Dialog.Description>
          </div>
        </div>
        <Dialog.Close
          aria-label="Kapat"
          className="flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface cursor-pointer"
        >
          <X className="size-5" />
        </Dialog.Close>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="ed-title" className={labelClasses}>
            Başlık
          </label>
          <input
            id="ed-title"
            required
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClasses}
            placeholder="Duyuru başlığı..."
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ed-body" className={labelClasses}>
            İçerik
          </label>
          <textarea
            id="ed-body"
            required
            maxLength={5000}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${fieldClasses} resize-none`}
            placeholder="Duyuru metni..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canSelectDept ? (
            <div className="space-y-1.5">
              <label htmlFor="ed-dept" className={labelClasses}>
                Hedef Kitle
              </label>
              <CustomSelect
                id="ed-dept"
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                options={[
                  { value: "", label: "Tüm Şirket (Genel)" },
                  ...departments.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  })),
                ]}
              />
            </div>
          ) : (
            <div className="space-y-1.5 opacity-80">
              <label className={labelClasses}>Hedef Kitle</label>
              <CustomSelect
                disabled
                value=""
                onChange={() => {}}
                options={[{ value: "", label: "Sadece Kendi Departmanınız" }]}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Tarih Aralığı <span className="text-on-surface-variant/60">(opsiyonel)</span>
            </label>
            <CustomDatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={expiresAt}
              onChange={(update) => setDateRange(update)}
              placeholderText="Başlangıç - Bitiş"
              className={fieldClasses}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Dialog.Close render={<Button variant="outline" />}>
            İptal
          </Dialog.Close>
          <Button
            type="submit"
            disabled={loading}
            className="bg-accent-cyan text-white hover:bg-accent-cyan/90 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Güncelle"}
          </Button>
        </div>
      </form>
    </>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  onSaved?: () => void;
};

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
  onSaved,
}: Props) {
  if (!announcement) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel custom-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <EditAnnouncementForm
            key={announcement.id}
            announcement={announcement}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
