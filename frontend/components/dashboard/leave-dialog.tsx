"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  apiFetch,
  getLeaveTypes,
  type ApiLeaveType,
} from "@/lib/api";
import { computeLeaveBalance } from "@/lib/data/balance";
import {
  attachmentConfig,
  leaveTypeLabels,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveType,
  type Personnel,
} from "@/lib/data/types";
import { workingDayCount } from "@/lib/date/business-days";
import { readFile } from "@/lib/image";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/50 placeholder-on-surface-variant/40";

const labelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

const typeOptions = Object.entries(leaveTypeLabels) as [LeaveType, string][];

type PersonOption = { id: string; name: string; department: string };

/** Bir personelin API detayını (izin geçmişiyle) alıp bakiye hesaplar. */
async function fetchBalance(personnelId: string, isEmployee: boolean = false): Promise<LeaveBalance | undefined> {
  const res = await apiFetch<any>(isEmployee ? "/me" : `/personnel/${personnelId}`);
  const d = isEmployee ? res.personnel : res;
  if (!d) return undefined;
  const person: Personnel = {
    id: String(d.id),
    name: d.name,
    department: d.department?.name ?? "",
    departmentId: d.department_id != null ? String(d.department_id) : undefined,
    phone: d.phone ?? "",
    status: d.status ?? "active",
    startDate: d.start_date ? String(d.start_date).slice(0, 10) : "",
    avatarUrl: d.user?.avatar_url || d.avatar_url || "",
    email: d.user?.email || "",
    role: d.user?.role || "employee",
    annualLeaveBalance: d.annual_leave_balance != null ? Number(d.annual_leave_balance) : undefined,
    carriedOverBalance: d.carried_over_balance != null ? Number(d.carried_over_balance) : undefined,
  };
  const leaves: LeaveRequest[] = (d.leave_requests ?? []).map((it: any) => ({
    id: String(it.id),
    personnelId: String(it.personnel_id),
    type: (it.leave_type?.slug as LeaveType) ?? "annual",
    startDate: it.start_date ? String(it.start_date).slice(0, 10) : "",
    endDate: it.end_date ? String(it.end_date).slice(0, 10) : "",
    status: it.status ?? "pending",
    createdAt: it.created_at ?? "",
  }));
  return computeLeaveBalance(person, leaves);
}

/* Inner form remounts (via key) each time the dialog opens, so useState
   initializers seed the fields — no reset effect required. */
function LeaveForm({
  leave,
  defaultPersonnelId,
  lockPersonnel,
  autoApprove,
  onClose,
  onSaved,
}: {
  leave: LeaveRequest | null;
  defaultPersonnelId?: string;
  lockPersonnel?: boolean;
  autoApprove?: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const isEdit = Boolean(leave);

  const [personnel, setPersonnel] = useState<PersonOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<ApiLeaveType[]>([]);

  const [personnelId, setPersonnelId] = useState(
    () => leave?.personnelId ?? defaultPersonnelId ?? ""
  );
  const [type, setType] = useState<LeaveType>(leave?.type ?? "annual");
  const [start, setStart] = useState(leave?.startDate ?? "");
  const [end, setEnd] = useState(leave?.endDate ?? "");
  const [note, setNote] = useState(leave?.note ?? "");
  const [attachmentName, setAttachmentName] = useState(leave?.attachmentName ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(leave?.attachmentUrl ?? "");
  const [balance, setBalance] = useState<LeaveBalance | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Personel ve izin türü listelerini yükle (formdaki seçiciler + slug→id eşlemesi).
  useEffect(() => {
    if (!lockPersonnel) {
      apiFetch<any[]>("/personnel")
        .then((rows) => {
          const opts: PersonOption[] = rows.map((p) => ({
            id: String(p.id),
            name: p.name,
            department: p.department?.name ?? "Genel",
          }));
          setPersonnel(opts);
          // Kilitli değilse ve henüz seçim yoksa ilk personeli varsayılan yap.
          setPersonnelId((current) => current || (opts[0]?.id ?? ""));
        })
        .catch(() => toast.error("Personel Listesi Alınamadı", "İzin seçimi için personel listesi yüklenirken hata oluştu."));
    }

    getLeaveTypes()
      .then(setLeaveTypes)
      .catch(() => toast.error("İzin Türleri Alınamadı", "Sistemdeki izin türleri yüklenirken hata oluştu."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kullanıcı profili asenkron yüklendiği için defaultPersonnelId sonradan gelebilir
  useEffect(() => {
    if (defaultPersonnelId && !personnelId) {
      setPersonnelId(defaultPersonnelId);
    }
  }, [defaultPersonnelId, personnelId]);

  // Yıllık izinde seçili personelin kalan bakiyesini API'den türet.
  // (Yıllık olmayan türlerde bakiye okunmaz; eski değeri sıfırlamaya gerek yok —
  //  effect gövdesinde senkron setState kuralı bunu yasaklıyor.)
  useEffect(() => {
    if (type !== "annual" || !personnelId) return;
    let cancelled = false;
    fetchBalance(personnelId, Boolean(lockPersonnel))
      .then((b) => {
        if (!cancelled) setBalance(b);
      })
      .catch(() => {
        if (!cancelled) setBalance(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [type, personnelId]);

  const requestedDays = start && end ? workingDayCount(start, end) : 0;

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Düzenleme yapıyorsak mevcut iznin günlerini bakiyeye ekleyerek (iade ederek) limit hesabı yap
  // Sadece 'approved' statüsündeki izinler bakiyeden düşüldüğü için, sadece onları iade etmeliyiz.
  const adjustedRemaining = balance
    ? balance.remaining + (leave && type === "annual" && leave.status === "approved" ? workingDayCount(leave.startDate, leave.endDate) : 0)
    : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personnelId) return;

    const totalDays = workingDayCount(start, end);

    // Bakiye kontrolü: yeni veya güncellenen YILLIK talep bakiyeyi aşamaz.
    if (type === "annual" && balance && totalDays > adjustedRemaining) {
      toast.error(
        "Yetersiz izin bakiyesi",
        `Bu işlem için en fazla ${adjustedRemaining} iş günü kullanabilirsiniz. Talep kaydedilmedi.`
      );
      return;
    }

    const leaveTypeId = leaveTypes.find((t) => t.slug === type)?.id;
    if (!leaveTypeId) {
      toast.error("Tanımsız İzin Türü", "Seçilen izin türü sistemde tanımlı değil.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("leave_type_id", String(leaveTypeId));
      formData.append("start_date", start);
      formData.append("end_date", end);
      formData.append("total_days", String(totalDays));
      if (note.trim()) {
        formData.append("note", note.trim());
      }
      
      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      } else if (attachmentUrl) {
        // Eski URL varsa ve silinmediyse onu gönder
        formData.append("attachment_url", attachmentUrl);
      }

      if (leave) {
        // Düzenleme
        // PHP requires _method=PUT for multipart/form-data updates
        formData.append("_method", "PUT");
        
        // Eğer izin önceden onaylanmışsa, düzenleme sonrası onaylı kalması için statüyü koruyoruz
        if (leave.status === "approved") {
          formData.append("status", "approved");
        }

        await apiFetch(`/leave-requests/${leave.id}`, {
          method: "POST",
          body: formData,
        });
        toast.success("İzin Talebi Güncellendi", `${start} - ${end} tarihlerine ait izin talebi detayları güncellendi.`);
      } else {
        formData.append("personnel_id", String(personnelId));
        if (autoApprove) {
          formData.append("status", "approved");
        }
        await apiFetch("/leave-requests", {
          method: "POST",
          body: formData,
        });
        toast.success(
          autoApprove ? "İzin Onaylandı ve Oluşturuldu" : "İzin Talebi Gönderildi",
          autoApprove
            ? `${totalDays} iş günlük izin kaydı doğrudan onaylanarak oluşturuldu.`
            : `${start} - ${end} tarihleri arasındaki ${totalDays} iş günü izin talebiniz onaya sunuldu.`
        );
      }
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İzin kaydı işlenirken bir sunucu hatası oluştu.";
      toast.error(isEdit ? "İzin Güncellenemedi" : "İzin Oluşturulamadı", msg);
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setAttachmentFile(file);
      // We don't read as base64 anymore to save memory, just keep the file
    }
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Dialog.Title className="text-2xl font-bold text-on-surface">
            {isEdit ? "İzin Talebini Düzenle" : autoApprove ? "Yeni İzin Oluştur" : "Yeni İzin Talebi"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-base text-on-surface-variant">
            {autoApprove ? "Personel için onaylı izin oluşturun." : "İzin talebi için formu doldurun."}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Kapat"
          className="flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
        >
          <X className="size-5" />
        </Dialog.Close>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!lockPersonnel && (
          <div className="space-y-1.5">
            <label htmlFor="l-personnel" className={labelClasses}>
              Personel
            </label>
            <CustomSelect
              id="l-personnel"
              required
              value={personnelId}
              disabled={isEdit}
              onChange={(val) => setPersonnelId(val)}
              placeholder={personnel.length === 0 ? "Yükleniyor…" : "Personel Seçin..."}
              options={personnel.map((p) => ({
                value: p.id,
                label: `${p.name} — ${p.department}`,
              }))}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="l-type" className={labelClasses}>
            İzin Türü
          </label>
          <CustomSelect
            id="l-type"
            value={type}
            onChange={(val) => setType(val as LeaveType)}
            options={typeOptions.map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Başlangıç
            </label>
            <CustomDatePicker
              required
              selected={start ? new Date(start + "T00:00:00") : null}
              onChange={(d) => setStart(d ? d.toLocaleDateString("en-CA") : "")}
              className={fieldClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Bitiş
            </label>
            <CustomDatePicker
              required
              minDate={start ? new Date(start + "T00:00:00") : undefined}
              selected={end ? new Date(end + "T00:00:00") : null}
              onChange={(d) => setEnd(d ? d.toLocaleDateString("en-CA") : "")}
              className={fieldClasses}
            />
          </div>
        </div>

        {/* Canlı bakiye bilgisi — yalnız yıllık izinde */}
        {type === "annual" && balance !== undefined && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 font-label-mono text-sm shadow-sm",
              requestedDays > adjustedRemaining
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan"
            )}
          >
            <div className="flex justify-between items-center mb-1">
              <span>Personelin Kalan Yıllık İzni:</span>
              <span className="font-bold text-base">{adjustedRemaining} İş Günü</span>
            </div>
            {requestedDays > 0 && (
              <div className="flex justify-between items-center text-xs opacity-80 border-t border-current/20 pt-1 mt-1">
                <span>Bu Talepte İstenen:</span>
                <span className="font-bold">{requestedDays} İş Günü</span>
              </div>
            )}
          </div>
        )}

        {attachmentConfig[type] && (
          <div className="space-y-1.5">
            <label htmlFor="l-file" className={labelClasses}>
              {attachmentConfig[type]!.label}{" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              id="l-file"
              type="file"
              required={!attachmentName}
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className={cn(
                fieldClasses,
                "file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent-cyan/10 file:px-4 file:py-1 file:text-sm file:font-bold file:text-accent-cyan hover:file:bg-accent-cyan/20 p-1"
              )}
            />
            {attachmentName && (
              <p className="text-xs text-on-surface-variant">
                Yüklü Dosya: {attachmentName}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="l-note" className={labelClasses}>
            Not (opsiyonel)
          </label>
          <textarea
            id="l-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="İzin sebebini kısaca açıklayın..."
            className={cn(fieldClasses, "resize-none")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Dialog.Close render={<Button variant="outline" />}>İptal</Dialog.Close>
          <Button
            type="submit"
            disabled={
              saving ||
              (!lockPersonnel && personnel.length === 0) ||
              !personnelId ||
              (type === "annual" && (!balance || requestedDays > adjustedRemaining))
            }
            className="bg-accent-cyan text-white hover:bg-accent-cyan/90 disabled:opacity-50"
          >
            {isEdit ? "Kaydet" : autoApprove ? "İzini Oluştur" : "Talebi Gönder"}
          </Button>
        </div>
      </form>
    </>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edits this request; otherwise creates a new one. */
  leave?: LeaveRequest | null;
  /** Pre-select a person (used when adding from a personnel context). */
  defaultPersonnelId?: string;
  /** Personel seçiciyi gizle ve defaultPersonnelId'ye sabitle (çalışan kendine talep). */
  lockPersonnel?: boolean;
  /** Otomatik olarak onaylanmış izin oluştur (Admin/Yönetici için). */
  autoApprove?: boolean;
  /** Called after a successful create/update so the caller can refresh its list. */
  onSaved?: () => void;
};

export function LeaveDialog({
  open,
  onOpenChange,
  leave,
  defaultPersonnelId,
  lockPersonnel,
  autoApprove,
  onSaved,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="glass-panel custom-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-xl p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <LeaveForm
            key={leave?.id ?? "new"}
            leave={leave ?? null}
            defaultPersonnelId={defaultPersonnelId}
            lockPersonnel={lockPersonnel}
            autoApprove={autoApprove}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
