"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, Trash2, CalendarDays } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { useRoleStore } from "@/components/auth/role-store";
import { useToast } from "@/components/ui/toast";
import { formatDateTR } from "@/lib/format";

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
export function AnnouncementsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const { simulatedRole } = useRoleStore();
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
  }, [refreshKey]);

  const filteredAnnouncements = useMemo(() => {
    if (!simulatedRole || !simulatedRole.startsWith("manager:")) {
      return announcements;
    }
    const deptId = Number(simulatedRole.split(":")[1]);
    return announcements.filter(a => !a.department_id || a.department_id === deptId);
  }, [announcements, simulatedRole]);

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/announcements/${id}`, { method: "DELETE" });
      toast.success("Duyuru silindi");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || "Silinemedi");
    }
  }

  if (!loading && filteredAnnouncements.length === 0 && !isAdmin) return null;

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent-violet/15 text-accent-violet">
            <Megaphone className="size-4" />
          </div>
          <h2 className="font-bold text-on-surface text-base">Duyurular</h2>
          {filteredAnnouncements.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-accent-violet/15 px-2 py-0.5 text-xs font-bold text-accent-violet">
              {filteredAnnouncements.length}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-on-surface-variant animate-pulse">Yükleniyor...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <p className="text-sm text-on-surface-variant/70 italic">
          {isAdmin ? "Henüz duyuru yok. İlk duyuruyu oluşturun." : "Aktif duyuru bulunmuyor."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-outline-variant/30 bg-surface-1 p-5 shadow-sm transition-all hover:border-outline-variant/60 relative group"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-on-surface text-lg leading-tight pr-8">{a.title}</h3>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="absolute right-4 top-4 p-2 rounded-lg text-error/70 hover:bg-error/10 hover:text-error opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      title="Duyuruyu Sil"
                    >
                      <Trash2 className="size-4" />
                    </button>
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
                    <CalendarDays className="size-3.5" />
                    {a.start_date ? formatDateTR(a.start_date) : formatDateTR(a.created_at)}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap mt-2 bg-surface-2/50 rounded-lg p-3 border border-outline-variant/20">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
