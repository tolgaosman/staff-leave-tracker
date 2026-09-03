"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, Trash2, CalendarDays, CalendarClock, Pencil } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { useRoleStore } from "@/components/auth/role-store";
import { useToast } from "@/components/ui/toast";
import { formatDateTR } from "@/lib/format";
import { EditAnnouncementDialog } from "@/components/dashboard/edit-announcement-dialog";

export type Announcement = {
  id: number;
  title: string;
  body: string;
  is_active: boolean;
  department_id?: number | null;
  department?: { id: number; name: string };
  start_date: string | null;
  expires_at: string | null;
  created_at: string;
  creator?: { id: number; name: string };
};

/* ── Main Component ─────────────────────────────────────────────────────── */
export function AnnouncementsPanel({
  refreshKey = 0,
  allowDelete = false,
  title,
  mode = "all",
  includeScheduled = false,
}: {
  refreshKey?: number;
  allowDelete?: boolean;
  title?: string;
  mode?: "all" | "active" | "scheduled";
  includeScheduled?: boolean;
}) {
  const { user } = useAuth();
  const { simulatedRole } = useRoleStore();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const canManage =
    allowDelete &&
    (user?.role === "super_admin" ||
      user?.role === "hr_admin" ||
      user?.role === "manager");

  const fetchWithScheduled = includeScheduled || mode === "scheduled" || mode === "all";

  function fetchAnnouncements() {
    setLoading(true);
    const endpoint = fetchWithScheduled ? "/announcements?include_scheduled=true" : "/announcements";
    apiFetch<Announcement[]>(endpoint)
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAnnouncements();
  }, [refreshKey, fetchWithScheduled]);

  const filteredAnnouncements = useMemo(() => {
    let list = announcements;

    if (simulatedRole && simulatedRole.startsWith("manager:")) {
      const deptId = Number(simulatedRole.split(":")[1]);
      list = list.filter(a => !a.department_id || a.department_id === deptId);
    }

    const now = new Date();
    if (mode === "active") {
      list = list.filter(a => !a.start_date || new Date(a.start_date) <= now);
    } else if (mode === "scheduled") {
      list = list.filter(a => Boolean(a.start_date) && new Date(a.start_date!) > now);
    }

    return list;
  }, [announcements, simulatedRole, mode]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await apiFetch(`/announcements/${id}`, { method: "DELETE" });
      toast.reject("Duyuru Silindi", "Seçilen duyuru sistemden kaldırıldı.");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error("Duyuru Silinemedi", err.message || "Duyuru silinirken bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!loading && filteredAnnouncements.length === 0 && !canManage && mode === "scheduled") {
    return null;
  }

  const panelTitle = title || (mode === "scheduled" ? "Gelecek Duyuru Planları" : mode === "active" ? "Mevcut Duyurular" : "Duyurular");
  const emptyText = mode === "scheduled" 
    ? "İlerleyen tarihler için planlanmış duyuru bulunmuyor." 
    : mode === "active"
    ? "Aktif yayınlanan duyuru bulunmuyor."
    : canManage 
    ? "Henüz duyuru yok. İlk duyuruyu oluşturun." 
    : "Aktif duyuru bulunmuyor.";

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-full ${mode === "scheduled" ? "bg-amber-500/15 text-amber-500" : "bg-accent-violet/15 text-accent-violet"}`}>
            {mode === "scheduled" ? <CalendarClock className="size-4" /> : <Megaphone className="size-4" />}
          </div>
          <h2 className="font-bold text-on-surface text-base">{panelTitle}</h2>
          {filteredAnnouncements.length > 0 && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${mode === "scheduled" ? "bg-amber-500/15 text-amber-500" : "bg-accent-violet/15 text-accent-violet"}`}>
              {filteredAnnouncements.length}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-on-surface-variant animate-pulse">Yükleniyor...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <p className="text-sm text-on-surface-variant/70 italic py-4">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a) => {
            const isScheduled = Boolean(a.start_date) && new Date(a.start_date!) > new Date();

            return (
              <div
                key={a.id}
                className="rounded-xl border border-outline-variant/30 bg-surface-1 p-5 shadow-sm transition-all hover:border-outline-variant/60 relative group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 pr-8 flex-wrap">
                      <h3 className="font-bold text-on-surface text-lg leading-tight">{a.title}</h3>
                      {isScheduled && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                          <CalendarClock className="size-3" />
                          Gelecek Duyuru
                        </span>
                      )}
                    </div>
                    {canManage && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setEditingAnnouncement(a)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-black/5 hover:text-primary transition-all cursor-pointer"
                          title="Duyuruyu Düzenle"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="p-1.5 rounded-lg text-error/70 hover:bg-error/10 hover:text-error transition-all disabled:opacity-50 cursor-pointer"
                          title="Duyuruyu Sil"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant/80 font-medium mt-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/50"></span>
                      {a.creator?.name || "Yönetim"}
                    </div>
                    
                    {a.department && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-2 border border-outline-variant/30">
                        {a.department.name} Departmanı
                      </div>
                    )}

                    {!a.department && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                        Tüm Şirket
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 ml-auto">
                      {isScheduled ? <CalendarClock className="size-3.5 text-amber-500" /> : <CalendarDays className="size-3.5" />}
                      <span>
                        {isScheduled ? "Yayın: " : ""}
                        {a.start_date ? formatDateTR(a.start_date) : formatDateTR(a.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mt-2 bg-surface-2/50 rounded-lg p-3 border border-outline-variant/20">
                  {a.body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <EditAnnouncementDialog
        open={editingAnnouncement !== null}
        onOpenChange={(open) => !open && setEditingAnnouncement(null)}
        announcement={editingAnnouncement}
        onSaved={fetchAnnouncements}
      />
    </div>
  );
}
