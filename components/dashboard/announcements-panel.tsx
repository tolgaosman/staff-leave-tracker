"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, Trash2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { useRoleStore } from "@/components/auth/role-store";
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
        <ul className="space-y-3">
          {filteredAnnouncements.map((a) => (
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
