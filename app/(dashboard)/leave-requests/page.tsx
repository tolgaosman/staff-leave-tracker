"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X, Trash2, CalendarClock, Search, RotateCcw } from "lucide-react";

import {
  LeaveRequest,
  LeaveType,
  attachmentConfig,
  leaveTypeLabels,
  leaveStatusLabels,
  leaveDayCount,
} from "@/lib/data/types";
import { workingDayCount } from "@/lib/date/business-days";
import { useHasDashboardAccess, useRoleStore, useRole } from "@/components/auth/role-store";
import { useToast } from "@/components/ui/toast";
import { CustomSelect } from "@/components/ui/custom-select";
import { apiFetch } from "@/lib/api";

import { Avatar } from "@/components/dashboard/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ConflictWarningDialog } from "@/components/dashboard/conflict-warning-dialog";
import { RejectDialog } from "@/components/dashboard/reject-dialog";
import { LeaveDialog } from "@/components/dashboard/leave-dialog";
import { AttachmentDialog } from "@/components/dashboard/attachment-dialog";
import { LeaveStatusBadge } from "@/components/dashboard/badges";
import { ExportButton } from "@/components/dashboard/export-button";
import { MobileCard, MobileCardList } from "@/components/dashboard/mobile-card-list";
import { ReasonDialog } from "@/components/dashboard/reason-dialog";


const filterSelectClasses =
  "w-full min-w-0 rounded-lg border border-outline-variant/30 bg-surface-1 px-3 py-2 font-sans text-sm text-on-surface outline-none transition-colors focus:border-accent-cyan cursor-pointer sm:w-auto";

export default function LeaveRequestsPage() {
  const hasAccess = useHasDashboardAccess();
  const role = useRole();
  const { simulatedRole } = useRoleStore();
  const router = useRouter();
  const toast = useToast();

  // Çalışan rolü bu sayfayı göremez → Genel Bakış'a yönlendir.
  useEffect(() => {
    if (!hasAccess) router.replace("/");
  }, [hasAccess, router]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [toDelete, setToDelete] = useState<LeaveRequest | null>(null);
  const [toReject, setToReject] = useState<LeaveRequest | null>(null);
  const [toApprove, setToApprove] = useState<LeaveRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Çoklu filtre: her alan bağımsız; "all" o kriteri baypas eder.
  const [filters, setFilters] = useState<{
    period: "all" | "this-month" | "last-month";
    department: string;
    type: "all" | LeaveType;
  }>({ period: "all", department: "all", type: "all" });

  const [requestsList, setRequestsList] = useState<LeaveRequest[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);

  const fetchData = () => {
    Promise.all([
      apiFetch<any[]>("/leave-requests"),
      apiFetch<any[]>("/personnel"),
    ])
      .then(([reqsData, persData]) => {
        setPersonnelList(persData);
        const mapped: LeaveRequest[] = reqsData.map((item) => {
          let typeStr: LeaveType = "annual";
          if (item.leave_type) {
            typeStr = (item.leave_type.slug as LeaveType) || "annual";
          }
          return {
            id: String(item.id),
            personnelId: String(item.personnel_id),
            type: typeStr,
            startDate: item.start_date ? item.start_date.slice(0, 10) : "",
            endDate: item.end_date ? item.end_date.slice(0, 10) : "",
            status: item.status || "pending",
            note: item.note || "",
            rejectionReason: item.rejection_reason || undefined,
            createdAt: item.created_at || new Date().toISOString(),
            attachmentUrl: item.attachment_url || undefined,
            attachmentName: item.attachment_name || undefined,
          };
        });
        setRequestsList(mapped);
      })
      .catch(() => {
        toast.error("İzin talepleri yüklenemedi");
      });
  };

  const handlePending = async (r: LeaveRequest) => {
    try {
      await apiFetch(`/leave-requests/${r.id}/pending`, { method: "PATCH" });
      toast.success("Talep tekrar bekliyor durumuna alındı");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const personnelMap = useMemo(() => {
    return new Map(
      personnelList.map((p) => [
        String(p.id),
        {
          id: String(p.id),
          name: p.name,
          department: p.department ? p.department.name : "Genel",
          departmentId: String(p.department_id),
          avatarUrl: p.user?.avatar_url || p.avatar_url || "",
        },
      ])
    );
  }, [personnelList]);

  // Filtre açılır menüsü için benzersiz departman listesi (mevcut personelden).
  const departments = useMemo(
    () => Array.from(new Set(personnelList.map((p) => p.department?.name || "Genel"))).sort(),
    [personnelList]
  );

  const sortedRequests = useMemo(() => {
    return [...requestsList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [requestsList]);

  const filteredRequests = useMemo(() => {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey = `${lastRef.getFullYear()}-${lastRef.getMonth()}`;

    const query = searchQuery.toLowerCase().trim();

    return sortedRequests.filter((r) => {
      const person = personnelMap.get(r.personnelId);
      if (!person) return false;

      // 1) Serbest metin arama
      if (query) {
        const matches =
          person.name.toLowerCase().includes(query) ||
          person.department.toLowerCase().includes(query) ||
          (leaveTypeLabels[r.type] || "").toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 2) Departman
      if (filters.department !== "all" && person.department !== filters.department) {
        return false;
      }

      // 3) İzin türü
      if (filters.type !== "all" && r.type !== filters.type) {
        return false;
      }

      // 4) Dönem (izin başlangıç tarihine göre)
      if (filters.period !== "all") {
        const [y, m] = r.startDate.split("-").map(Number);
        const key = `${y}-${m - 1}`;
        if (filters.period === "this-month" && key !== thisKey) return false;
        if (filters.period === "last-month" && key !== lastKey) return false;
      }

      // 5) Simüle edilen Manager rolü filtresi
      if (simulatedRole && simulatedRole.startsWith("manager:")) {
        const simulatedDeptId = simulatedRole.split(":")[1];
        if (person.departmentId !== simulatedDeptId) return false;
      }

      return true;
    });
  }, [sortedRequests, personnelMap, searchQuery, filters, simulatedRole]);

  if (!hasAccess) return null;

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col items-stretch gap-4 border-b border-outline-variant/20 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
              İzin Talepleri
            </h2>
            <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
              Tüm personel izin talepleri, onay durumları ve izin süreleri.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <ExportButton
              className="flex-1 justify-center sm:flex-none"
              filename="izin-talepleri"
              rows={filteredRequests}
              columns={[
                {
                  header: "Personel",
                  value: (r) => personnelMap.get(r.personnelId)?.name ?? "",
                },
                {
                  header: "Departman",
                  value: (r) => personnelMap.get(r.personnelId)?.department ?? "",
                },
                { header: "İzin Türü", value: (r) => leaveTypeLabels[r.type] },
                { header: "Başlangıç", value: (r) => r.startDate },
                { header: "Bitiş", value: (r) => r.endDate },
                {
                  header: "İş Günü",
                  value: (r) => workingDayCount(r.startDate, r.endDate),
                },
                { header: "Durum", value: (r) => leaveStatusLabels[r.status] },
                {
                  header: "Reddetme Gerekçesi",
                  value: (r) => r.rejectionReason ?? "",
                },
              ]}
            />
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-base font-bold text-white dark:text-black shadow transition-all hover:opacity-90 active:scale-95 cursor-pointer sm:flex-none"
            >
              <Plus className="size-5" />
              <span>{hasAccess ? "Yeni İzin Oluştur" : "Yeni İzin Talebi"}</span>
            </button>
          </div>
        </div>

        {requestsList.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center p-6 glass-panel rounded-xl my-6 md:min-h-[300px] md:p-12">
            <p className="font-sans text-lg text-on-surface-variant max-w-md">
              Sistemde henüz izin talebi bulunamadı. Listeyi oluşturmak için sağ üstteki &quot;{hasAccess ? "Yeni İzin Oluştur" : "Yeni İzin Talebi"}&quot; butonuna tıklayınız.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Arama + Çoklu Filtreler */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <div className="relative col-span-2 w-full sm:min-w-[240px] sm:flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Personel adı, departman veya izin türü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-1 py-2 pl-9 pr-4 font-sans text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-accent-cyan"
                />
              </div>

              <div className="col-span-1 min-w-[140px]">
                <CustomSelect
                  ariaLabel="Dönem"
                  value={filters.period}
                  onChange={(val) =>
                    setFilters((f) => ({
                      ...f,
                      period: val as typeof f.period,
                    }))
                  }
                  options={[
                    { value: "all", label: "Tüm Dönemler" },
                    { value: "this-month", label: "Bu Ay" },
                    { value: "last-month", label: "Geçen Ay" },
                  ]}
                />
              </div>

              {role === "super_admin" && (
                <div className="col-span-1 min-w-[160px]">
                  <CustomSelect
                    ariaLabel="Departman"
                    value={filters.department}
                    onChange={(val) =>
                      setFilters((f) => ({ ...f, department: val }))
                    }
                    options={[
                      { value: "all", label: "Tüm Departmanlar" },
                      ...departments.map((d) => ({
                        value: d,
                        label: d,
                      })),
                    ]}
                  />
                </div>
              )}

              <div className="col-span-1 min-w-[150px]">
                <CustomSelect
                  ariaLabel="İzin Türü"
                  value={filters.type}
                  onChange={(val) =>
                    setFilters((f) => ({
                      ...f,
                      type: val as typeof f.type,
                    }))
                  }
                  options={[
                    { value: "all", label: "Tüm Türler" },
                    ...(Object.entries(leaveTypeLabels) as [LeaveType, string][]).map(
                      ([value, label]) => ({
                        value,
                        label,
                      })
                    ),
                  ]}
                />
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center p-5 glass-panel rounded-xl md:min-h-[200px] md:p-8">
                <p className="font-sans text-base text-on-surface-variant">
                  Arama kriterlerinize uygun izin talebi bulunamadı.
                </p>
              </div>
            ) : (
              <>
              {/* Mobil: kart listesi */}
              <MobileCardList>
                {filteredRequests.map((r) => {
                  const person = personnelMap.get(r.personnelId);
                  const days = leaveDayCount(r.startDate, r.endDate);

                  return (
                    <MobileCard
                      key={r.id}
                      leading={
                        <Avatar
                          name={person?.name || "Bilinmeyen"}
                          url={person?.avatarUrl}
                          className="size-10 shrink-0"
                        />
                      }
                      title={person?.name || "Bilinmeyen Personel"}
                      subtitle={person?.department || "-"}
                      badge={
                        <div className="flex items-center">
                          <LeaveStatusBadge status={r.status} />
                          {r.status === 'rejected' && r.rejectionReason && (
                            <ReasonDialog reason={r.rejectionReason} />
                          )}
                        </div>
                      }
                      rows={[
                        {
                          label: "İzin Türü",
                          value: (
                            <span className="inline-flex items-center gap-2">
                              <span className="font-medium text-primary">
                                {leaveTypeLabels[r.type]}
                              </span>
                              {r.attachmentUrl && (
                                <AttachmentDialog
                                  url={r.attachmentUrl}
                                  name={r.attachmentName}
                                  label={attachmentConfig[r.type]?.label}
                                >
                                  <span className="inline-flex items-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold text-accent-cyan">
                                    {attachmentConfig[r.type]?.buttonLabel ?? "Belge"}
                                  </span>
                                </AttachmentDialog>
                              )}
                            </span>
                          ),
                        },
                        {
                          label: "Tarih",
                          value: (
                            <span className="font-mono text-xs">
                              {new Date(r.startDate).toLocaleDateString("tr-TR")} –{" "}
                              {new Date(r.endDate).toLocaleDateString("tr-TR")}
                            </span>
                          ),
                        },
                        {
                          label: "Süre",
                          value: (
                            <span className="font-mono text-xs font-bold text-primary">
                              {days} Gün
                            </span>
                          ),
                        },
                      ]}
                      actions={
                        hasAccess ? (
                          <>
                            {r.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setToApprove(r)}
                                  title="Onayla"
                                  className="flex size-9 items-center justify-center rounded-md border border-green-600/30 bg-green-500/10 text-green-700 active:scale-95"
                                >
                                  <Check className="size-4" />
                                </button>
                                <button
                                  onClick={() => setToReject(r)}
                                  title="Reddet"
                                  className="flex size-9 items-center justify-center rounded-md border border-red-600/30 bg-red-500/10 text-red-700 active:scale-95"
                                >
                                  <X className="size-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setEditing(r);
                                setDialogOpen(true);
                              }}
                              title="Düzenle"
                              className="flex size-9 items-center justify-center rounded-md border border-outline-variant/30 text-on-surface-variant active:scale-95"
                            >
                              <CalendarClock className="size-4" />
                            </button>
                            <button
                              onClick={() => setToDelete(r)}
                              title="Sil"
                              className="flex size-9 items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 text-destructive active:scale-95"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        ) : undefined
                      }
                    />
                  );
                })}
              </MobileCardList>

              {/* Masaüstü: tablo */}
              <div className="glass-panel hidden overflow-hidden rounded-xl md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 font-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
                        <th className="px-6 py-4 font-bold">Personel</th>
                        <th className="px-6 py-4 font-bold">İzin Türü</th>
                        <th className="px-6 py-4 font-bold">Tarih Aralığı</th>
                        <th className="px-6 py-4 font-bold">Süre</th>
                        <th className="px-6 py-4 font-bold">Durum</th>
                        {hasAccess && (
                          <th className="px-6 py-4 text-right font-bold">İşlemler</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((r) => {
                        const person = personnelMap.get(r.personnelId);
                        const days = leaveDayCount(r.startDate, r.endDate);

                        return (
                          <tr
                            key={r.id}
                            className="border-b border-outline-variant/15 font-sans text-sm text-on-surface hover:bg-black/[0.02]"
                          >
                            {/* Personel Avatarlı Kolon */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={person?.name || "Bilinmeyen"} url={person?.avatarUrl} className="size-8" />
                                <div>
                                  <div className="font-bold text-base text-primary">
                                    {person?.name || "Bilinmeyen Personel"}
                                  </div>
                                  <div className="text-xs text-on-surface-variant/70">
                                    {person?.department || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* İzin Türü */}
                            <td className="px-6 py-4 font-medium text-primary">
                              <div className="flex items-center gap-2">
                                <span>{leaveTypeLabels[r.type]}</span>
                                {r.attachmentUrl && (
                                  <AttachmentDialog
                                    url={r.attachmentUrl}
                                    name={r.attachmentName}
                                    label={attachmentConfig[r.type]?.label}
                                  >
                                    <span
                                      className="inline-flex items-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold text-accent-cyan hover:bg-accent-cyan/20"
                                      title={attachmentConfig[r.type]?.label ?? "Belge"}
                                    >
                                      {attachmentConfig[r.type]?.buttonLabel ?? "Belge"}
                                    </span>
                                  </AttachmentDialog>
                                )}
                              </div>
                            </td>

                            {/* Tarih Aralığı */}
                            <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                              {new Date(r.startDate).toLocaleDateString("tr-TR")} - {new Date(r.endDate).toLocaleDateString("tr-TR")}
                            </td>

                            {/* İzin Süresi */}
                            <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                              {days} Gün
                            </td>

                            {/* Durum Rozeti */}
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <LeaveStatusBadge status={r.status} />
                                {r.status === 'rejected' && r.rejectionReason && (
                                  <ReasonDialog reason={r.rejectionReason} />
                                )}
                              </div>
                            </td>

                            {/* İşlemler (Onay/Red/Düzenle/Sil) — yalnız admin */}
                            {hasAccess && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {r.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => setToApprove(r)}
                                      title="Onayla"
                                      className="flex size-8 items-center justify-center rounded-md border border-green-600/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 active:scale-95 cursor-pointer"
                                    >
                                      <Check className="size-4" />
                                    </button>
                                    <button
                                      onClick={() => setToReject(r)}
                                      title="Reddet"
                                      className="flex size-8 items-center justify-center rounded-md border border-red-600/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 active:scale-95 cursor-pointer"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handlePending(r)}
                                    title="Durumu Tekrar Bekliyora Çek"
                                    className="flex size-8 items-center justify-center rounded-md border border-amber-600/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 active:scale-95 cursor-pointer"
                                  >
                                    <RotateCcw className="size-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditing(r);
                                    setDialogOpen(true);
                                  }}
                                  title="Düzenle"
                                  className="flex size-8 items-center justify-center rounded-md border border-outline-variant/30 text-on-surface-variant hover:bg-black/5 active:scale-95 cursor-pointer"
                                >
                                  <CalendarClock className="size-4" />
                                </button>
                                <button
                                  onClick={() => setToDelete(r)}
                                  title="Sil"
                                  className="flex size-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>

      <LeaveDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        leave={editing || undefined}
        autoApprove={hasAccess && !editing}
        onSaved={fetchData}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Talebi Sil"
        description="Bu izin talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onConfirm={async () => {
          if (toDelete) {
            try {
              await apiFetch(`/leave-requests/${toDelete.id}`, { method: "DELETE" });
              toast.success("Talep silindi");
              fetchData();
            } catch (err: any) {
              toast.error(err.message || "Silme başarısız");
            }
            setToDelete(null);
          }
        }}
      />

      <RejectDialog
        open={toReject !== null}
        onOpenChange={(o) => !o && setToReject(null)}
        onConfirm={async (reason) => {
          if (toReject) {
            try {
              await apiFetch(`/leave-requests/${toReject.id}/reject`, {
                method: "PATCH",
                body: JSON.stringify({ rejection_reason: reason }),
              });
              toast.success("Talep reddedildi");
              fetchData();
            } catch (err: any) {
              toast.error(err.message || "İşlem başarısız");
            }
            setToReject(null);
          }
        }}
      />

      {/* Çakışma Uyarısı — onay butonuna basıldığında açılır */}
      {toApprove && (
        <ConflictWarningDialog
          leaveRequestId={toApprove.id}
          open={toApprove !== null}
          onCancel={() => setToApprove(null)}
          onConfirm={async () => {
            try {
              await apiFetch(`/leave-requests/${toApprove.id}/approve`, { method: "PATCH" });
              toast.success("Talep onaylandı");
              fetchData();
            } catch (err: any) {
              toast.error(err.message || "İşlem başarısız");
            }
            setToApprove(null);
          }}
        />
      )}
    </>
  );
}
