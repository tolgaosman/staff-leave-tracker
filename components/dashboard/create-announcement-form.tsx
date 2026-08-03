"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { useRole } from "@/components/auth/role-store";
import { useToast } from "@/components/ui/toast";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomSelect } from "@/components/ui/custom-select";

export function CreateAnnouncementForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const role = useRole();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, expiresAt] = dateRange;
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const canSelectDept = role === "super_admin" || role === "hr_admin";
  const isAdmin = canSelectDept || role.startsWith("manager");

  useEffect(() => {
    if (canSelectDept && departments.length === 0) {
      apiFetch<any[]>("/departments").then(setDepartments).catch(() => { });
    }
  }, [canSelectDept, departments.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !expiresAt) {
      toast.error("Lütfen duyuru başlangıç ve bitiş tarihlerini seçin.");
      return;
    }
    setLoading(true);
    try {
      let finalStartDate: string | null = null;
      if (startDate) {
        const today = new Date();
        const isToday = startDate.getDate() === today.getDate() &&
          startDate.getMonth() === today.getMonth() &&
          startDate.getFullYear() === today.getFullYear();
        if (isToday) {
          finalStartDate = today.toISOString();
        } else {
          const d = new Date(startDate);
          d.setHours(8, 0, 0, 0);
          finalStartDate = d.toISOString();
        }
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
      if (canSelectDept && departmentId) {
        payload.department_id = departmentId;
      } else if (role.startsWith("manager:")) {
        payload.department_id = role.split(":")[1];
      }

      await apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Duyuru yayınlandı");
      setTitle(""); setBody(""); setDateRange([null, null]); setDepartmentId("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Duyuru oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="glass-panel rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent-cyan/15 text-accent-cyan">
          <Plus className="size-4" />
        </div>
        <h2 className="font-bold text-on-surface text-base">Duyuru Oluşturma</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-on-surface-variant">Başlık</label>
          <input
            required
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Duyuru başlığı..."
            className="w-full rounded-lg border border-outline-variant/40 bg-surface-2 px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-cyan"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-on-surface-variant">İçerik</label>
          <textarea
            required
            maxLength={5000}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Duyuru metni..."
            className="w-full rounded-lg border border-outline-variant/40 bg-surface-2 px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-cyan resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canSelectDept ? (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant">Hedef Kitle</label>
              <CustomSelect
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
              <label className="text-sm font-semibold text-on-surface-variant">Hedef Kitle</label>
              <CustomSelect
                disabled
                value=""
                onChange={() => { }}
                options={[{ value: "", label: "Sadece Kendi Departmanınız" }]}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant">
              Tarih Aralığı <span className="text-destructive">*</span>
            </label>
            <CustomDatePicker
              required
              selectsRange={true}
              startDate={startDate}
              endDate={expiresAt}
              onChange={(update) => setDateRange(update)}
              placeholderText="Başlangıç - Bitiş"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent-cyan px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-cyan/90 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? "Yayınlanıyor..." : "Yayınla"}
          </button>
        </div>
      </form>
    </div>
  );
}
