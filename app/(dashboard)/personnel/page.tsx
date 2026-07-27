"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Eye, Search } from "lucide-react";
import { useIsAdmin } from "@/components/auth/role-store";
import { Personnel, personnelStatusLabels } from "@/lib/data/types";
import { Avatar } from "@/components/dashboard/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PersonnelDialog } from "@/components/dashboard/personnel-dialog";
import { ExportButton } from "@/components/dashboard/export-button";
import { MobileCard, MobileCardList } from "@/components/dashboard/mobile-card-list";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import Link from "next/link";


export default function PersonnelPage() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Personnel | null>(null);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Çalışan rolü personel listesini göremez → Genel Bakış'a yönlendir.
  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);

  const fetchPersonnel = () => {
    apiFetch<any[]>("/personnel")
      .then((data) => {
        const mapped: Personnel[] = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          department: item.department ? item.department.name : "Genel",
          departmentId: String(item.department_id),
          phone: item.phone || "-",
          status: item.status || "active",
          startDate: item.start_date || "",
          avatarUrl: item.avatar_url || "",
          email: item.user?.email || "",
        }));
        setPersonnelList(mapped);
      })
      .catch(() => {
        toast.error("Personel listesi yüklenemedi");
      });
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.department.toLowerCase().includes(query) ||
        p.phone.includes(query)
      );
    });
  }, [personnelList, searchQuery]);



  return (
    <>
      <div className="space-y-8">
        {/* Sayfa Başlığı ve Ekleme Butonu */}
        <div className="flex flex-col items-stretch gap-4 border-b border-outline-variant/20 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
              Personel Listesi
            </h2>
            <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
              Tüm şirket personelinin detayları, departmanları ve güncel çalışma durumları.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <ExportButton
              className="flex-1 justify-center sm:flex-none"
              filename="personel-listesi"
              rows={filteredPersonnel}
              columns={[
                { header: "Ad Soyad", value: (p) => p.name },
                { header: "Departman", value: (p) => p.department },
                { header: "Telefon", value: (p) => p.phone },
                { header: "Durum", value: (p) => personnelStatusLabels[p.status] },
                { header: "E-posta", value: (p) => p.email ?? "" },
                { header: "Başlangıç", value: (p) => p.startDate ?? "" },
              ]}
            />
            {isAdmin && (
              <button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-base font-bold text-white dark:text-black shadow transition-all hover:opacity-90 active:scale-95 cursor-pointer sm:flex-none"
              >
                <Plus className="size-5" />
                <span>Yeni Personel</span>
              </button>
            )}
          </div>
        </div>

        {personnelList.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center p-6 glass-panel rounded-xl my-6 md:min-h-[300px] md:p-12">
            <p className="font-sans text-lg text-on-surface-variant max-w-md">
              Sistemde henüz personel kaydı bulunamadı. Listeyi oluşturmak için sağ üstteki &quot;Yeni Personel&quot; butonuna tıklayınız.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Arama Çubuğu*/}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Personel adı, departman veya telefon ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-1 py-2 pl-9 pr-4 font-sans text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-accent-cyan"
                />
              </div>
            </div>

            {filteredPersonnel.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center p-5 glass-panel rounded-xl md:min-h-[200px] md:p-8">
                <p className="font-sans text-base text-on-surface-variant">
                  Arama kriterlerinize uygun personel bulunamadı.
                </p>
              </div>
            ) : (
              <>
              {/* Mobil: kart listesi */}
              <MobileCardList>
                {filteredPersonnel.map((p) => (
                  <MobileCard
                    key={p.id}
                    leading={<Avatar name={p.name} url={p.avatarUrl} className="size-10 shrink-0" />}
                    title={p.name}
                    subtitle={p.department}
                    badge={
                      <span className="inline-block rounded-full border border-outline-variant/30 bg-white/50 px-3 py-1 font-mono text-xs font-semibold text-secondary">
                        {personnelStatusLabels[p.status]}
                      </span>
                    }
                    rows={[
                      { label: "Telefon", value: <span className="font-mono text-xs">{p.phone}</span> },
                      {
                        label: "Başlangıç",
                        value: (
                          <span className="font-mono text-xs">
                            {p.startDate ? new Date(p.startDate).toLocaleDateString("tr-TR") : "-"}
                          </span>
                        ),
                      },
                    ]}
                    actions={
                      <>
                        <Link
                          href={`/personnel/detail?id=${p.id}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant transition-colors active:scale-95"
                          title="Detay"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditing(p);
                                setDialogOpen(true);
                              }}
                              className="flex size-9 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant transition-colors active:scale-95"
                              title="Düzenle"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => setToDelete(p)}
                              className="flex size-9 items-center justify-center rounded-lg border border-outline-variant/30 text-destructive transition-colors active:scale-95"
                              title="Sil"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        )}
                      </>
                    }
                  />
                ))}
              </MobileCardList>

              {/* Masaüstü: tablo */}
              <div className="glass-panel hidden overflow-hidden rounded-xl md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 font-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
                        <th className="px-6 py-4 font-bold">Personel</th>
                        <th className="px-6 py-4 font-bold">Departman</th>
                        <th className="px-6 py-4 font-bold">Durum</th>
                        <th className="px-6 py-4 font-bold">Telefon</th>
                        <th className="px-6 py-4 font-bold">Başlangıç Tarihi</th>
                        <th className="px-6 py-4 text-right font-bold">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPersonnel.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-outline-variant/10 transition-colors hover:bg-white/40 last:border-0"
                        >
                          {/* 1. Sütun: Profil Resmi ve İsim */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={p.name} url={p.avatarUrl} className="size-9 shrink-0" />
                              <span className="font-bold text-primary">{p.name}</span>
                            </div>
                          </td>

                          {/* 2. Sütun: Departman */}
                          <td className="px-6 py-4 text-on-surface-variant font-sans">
                            {p.department}
                          </td>

                          {/* 3. Sütun: Durum (Badge) */}
                          <td className="px-6 py-4">
                            <span className="inline-block rounded-full border border-outline-variant/30 px-3 py-1 font-mono text-xs font-semibold bg-white/50 text-secondary">
                              {personnelStatusLabels[p.status]}
                            </span>
                          </td>

                          {/* 4. Sütun: Telefon */}
                          <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">
                            {p.phone}
                          </td>

                          {/* 4.5. Sütun: Başlangıç Tarihi */}
                          <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">
                            {p.startDate ? new Date(p.startDate).toLocaleDateString("tr-TR") : "-"}
                          </td>

                          {/* 5. Sütun: Aksiyon Butonları */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/personnel/detail?id=${p.id}`}
                                className="flex size-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-white hover:text-primary"
                                title="Detay"
                              >
                                <Eye className="size-4" />
                              </Link>

                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditing(p);
                                      setDialogOpen(true);
                                    }}
                                    className="flex size-8 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-white hover:text-primary cursor-pointer"
                                    title="Düzenle"
                                  >
                                    <Pencil className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => setToDelete(p)}
                                    className="flex size-8 items-center justify-center rounded-lg border border-outline-variant/30 text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                                    title="Sil"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Personel Ekleme / Düzenleme Formu */}
      <PersonnelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        personnel={editing}
        onSaved={fetchPersonnel}
      />

      {/* Silme Onaylama Penceresi */}
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Personeli Sil"
        description="Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu personele ait tüm izin talepleri de silinecektir."
        onConfirm={async () => {
          if (toDelete) {
            try {
              await apiFetch(`/personnel/${toDelete.id}`, { method: "DELETE" });
              toast.success("Personel silindi");
              fetchPersonnel();
            } catch {
              toast.error("Personel silinemedi");
            }
            setToDelete(null);
          }
        }}
      />
    </>
  );
}
