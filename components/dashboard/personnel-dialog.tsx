"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CustomSelect } from "@/components/ui/custom-select";
import { Avatar } from "@/components/dashboard/avatar";
import { ImageCropper } from "@/components/dashboard/image-cropper";
import { readFile } from "@/lib/image";
import { apiFetch, getDepartments, type ApiDepartment } from "@/lib/api";
import {
  personnelStatusLabels,
  type Personnel,
  type PersonnelStatus,
} from "@/lib/data/types";

const fieldClasses =
  "w-full rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/50 placeholder-on-surface-variant/40";

const labelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

const statusOptions = Object.entries(personnelStatusLabels) as [
  PersonnelStatus,
  string
][];

/* Inner form remounts (via key) whenever the dialog opens for a record,
   so useState initializers seed the fields — no reset effect needed. */
function PersonnelForm({
  personnel,
  onClose,
  onSaved,
}: {
  personnel: Personnel | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(personnel);
  const toast = useToast();
  const [name, setName] = useState(personnel?.name ?? "");
  const [phone, setPhone] = useState(personnel?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(personnel?.avatarUrl ?? "");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<PersonnelStatus>(
    personnel?.status ?? "active"
  );

  // Departmanlar API'den gelir; seçici bu listeden beslenir.
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [departmentId, setDepartmentId] = useState(personnel?.departmentId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDepartments()
      .then((list) => {
        setDepartments(list);
        // Yeni kayıtta ilk departmanı varsayılan seç.
        setDepartmentId((current) =>
          current || (list[0] ? String(list[0].id) : "")
        );
      })
      .catch(() => toast.error("Departmanlar yüklenemedi"));
    // toast kimliği sabit; yalnızca ilk açılışta çalışsın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!departmentId) {
      toast.error("Lütfen bir departman seçin");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        department_id: Number(departmentId),
        phone: phone.trim(),
        status,
        avatar_url: avatarUrl || null,
      };
      if (personnel) {
        // Düzenleme (PUT /api/personnel/{id})
        await apiFetch(`/personnel/${personnel.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Personel güncellendi");
      } else {
        // Yeni Ekleme (POST /api/personnel)
        await apiFetch("/personnel", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            start_date: new Date().toISOString().slice(0, 10),
          }),
        });
        toast.success("Personel eklendi");
      }
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İşlem başarısız";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageDataUrl = await readFile(file);
        setCropSrc(imageDataUrl);
      } catch (err) {
        console.error("Resim yüklenirken hata oluştu:", err);
      }
      e.target.value = "";
    }
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Dialog.Title className="text-2xl font-bold text-on-surface">
            {isEdit ? "Personel Düzenle" : "Yeni Personel"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-base text-on-surface-variant">
            Personel bilgilerini {isEdit ? "güncelleyin" : "girin"}.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Kapat"
          className="flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
        >
          <X className="size-5" />
        </Dialog.Close>
      </div>

      <div className="mb-6 flex justify-center">
        <label className="relative cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Avatar
            name={name || "Yeni Personel"}
            url={avatarUrl}
            className="size-20 border border-white/10 text-lg group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold font-mono">DEĞİŞTİR</span>
          </div>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="p-name" className={labelClasses}>
            Ad Soyad
          </label>
          <input
            id="p-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adı Soyadı"
            className={fieldClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="p-dept" className={labelClasses}>
              Departman
            </label>
            <CustomSelect
              id="p-dept"
              required
              value={departmentId}
              onChange={(val) => setDepartmentId(val)}
              placeholder={departments.length === 0 ? "Yükleniyor…" : "Departman Seçin..."}
              options={departments.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="p-phone" className={labelClasses}>
              Telefon
            </label>
            <input
              id="p-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0500 000 00 00"
              className={fieldClasses}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-status" className={labelClasses}>
            Durum
          </label>
          <CustomSelect
            id="p-status"
            value={status}
            onChange={(val) => setStatus(val as PersonnelStatus)}
            options={statusOptions.map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>


        <div className="flex justify-end gap-3 pt-2">
          <Dialog.Close render={<Button variant="outline" />}>İptal</Dialog.Close>
          <Button
            type="submit"
            disabled={saving}
            className="bg-accent-cyan text-white hover:bg-accent-cyan/90"
          >
            {isEdit ? "Kaydet" : "Ekle"}
          </Button>
        </div>
      </form>

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onComplete={(cropped) => {
            setAvatarUrl(cropped);
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this record; otherwise it creates one. */
  personnel?: Personnel | null;
  /** Called after a successful create/update so the caller can refresh its list. */
  onSaved?: () => void;
};

export function PersonnelDialog({ open, onOpenChange, personnel, onSaved }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel custom-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <PersonnelForm
            key={personnel?.id ?? "new"}
            personnel={personnel ?? null}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
