"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";

export type Announcement = {
  id: number;
  title: string;
  body: string;
  is_active: boolean;
  department_id?: number | null;
  department?: { id: number; name: string };
  expires_at: string | null;
  created_at: string;
  creator?: { id: number; name: string };
};

/* ── Create Dialog (admin only) ─────────────────────────────────────────── */
function CreateAnnouncementDialog({ onCreated, userRole }: { onCreated: () => void; userRole?: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const canSelectDept = userRole === "super_admin" || userRole === "hr_admin";

  useEffect(() => {
    if (open && canSelectDept && departments.length === 0) {
      apiFetch<any[]>("/departments").then(setDepartments).catch(() => {});
    }
  }, [open, canSelectDept, departments.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        title,
        body,
        expires_at: expiresAt || null,
      };
      if (canSelectDept && departmentId) {
        payload.department_id = departmentId;
      }

      await apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Duyuru yayınlandı");
      setTitle(""); setBody(""); setExpiresAt(""); setDepartmentId("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Duyuru oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 px-3 py-1.5 text-sm font-bold text-accent-cyan hover:bg-accent-cyan/20 active:scale-95 transition-all"
      >
        <Plus className="size-4" />
        Yeni Duyuru
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-surface-1 p-6 shadow-2xl outline-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-bold text-on-surface">
                Yeni Duyuru Oluştur
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-1.5 text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 active:scale-95">
                <X className="size-5" />
              </Dialog.Close>
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

              {canSelectDept && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-on-surface-variant">Hedef Kitle</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-2 px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-cyan"
                  >
                    <option value="">Tüm Şirket (Genel)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Son Geçerlilik Tarihi <span className="text-on-surface-variant/60">(opsiyonel)</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-2 px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-cyan"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Dialog.Close className="rounded-lg bg-surface-2 px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-3 active:scale-95">
                  İptal
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-bold text-white hover:bg-accent-cyan/90 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Yayınlanıyor..." : "Yayınla"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export function AnnouncementsPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "super_admin" || user?.role === "hr_admin" || user?.role === "manager";

  function fetchAnnouncements() {
    setLoading(true);
    apiFetch<Announcement[]>("/announcements")
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/announcements/${id}`, { method: "DELETE" });
      toast.success("Duyuru silindi");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || "Silinemedi");
    }
  }

  if (!loading && announcements.length === 0 && !isAdmin) return null;

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent-violet/15 text-accent-violet">
            <Megaphone className="size-4" />
          </div>
          <h2 className="font-bold text-on-surface text-base">Duyurular</h2>
          {announcements.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-accent-violet/15 px-2 py-0.5 text-xs font-bold text-accent-violet">
              {announcements.length}
            </span>
          )}
        </div>
        {isAdmin && <CreateAnnouncementDialog onCreated={fetchAnnouncements} userRole={user?.role} />}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-on-surface-variant animate-pulse">Yükleniyor...</div>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-on-surface-variant/70 italic">
          {isAdmin ? "Henüz duyuru yok. İlk duyuruyu oluşturun." : "Aktif duyuru bulunmuyor."}
        </p>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-accent-violet/20 bg-accent-violet/5 p-4 flex gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface leading-snug flex items-center gap-2">
                  {a.title}
                  {a.department ? (
                    <span className="inline-flex items-center rounded bg-accent-cyan/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
                      {a.department.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-accent-violet/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-violet">
                      Genel
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {a.body}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant/60">
                  {a.creator && <span>Yayınlayan: {a.creator.name}</span>}
                  <span>{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>
                  {a.expires_at && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Bitiş: {new Date(a.expires_at).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 rounded-full p-1.5 text-on-surface-variant/50 hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                  title="Duyuruyu sil"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
