"use client";

import { ArrowLeft, Briefcase, CalendarDays, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Personnel, LeaveRequest, leaveTypeLabels } from "@/lib/data/types";
import { useIsAdmin } from "@/components/auth/role-store";
import { Avatar } from "@/components/dashboard/avatar";
import {
  LeaveStatusBadge,
  PersonnelStatusBadge,
} from "@/components/dashboard/badges";
import { MobileCard, MobileCardList } from "@/components/dashboard/mobile-card-list";
import { workingDayCount } from "@/lib/date/business-days";

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("tr-TR");
}

function PersonnelDetail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const [person, setPerson] = useState<Personnel | null>(null);
  const [personLeaves, setPersonLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Çalışan rolü başka personelin detayını göremez → Genel Bakış'a yönlendir.
  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<any>(`/personnel/${id}`)
      .then((data) => {
        setPerson({
          id: String(data.id),
          name: data.name,
          department: data.department ? data.department.name : "Genel",
          phone: data.phone || "-",
          status: data.status || "active",
          startDate: data.start_date || "",
          avatarUrl: data.avatar_url || "",
          email: data.user?.email || "",
        });

        if (Array.isArray(data.leave_requests)) {
          const mappedLeaves: LeaveRequest[] = data.leave_requests.map((item: any) => ({
            id: String(item.id),
            personnelId: String(data.id),
            type: (item.leave_type?.slug as any) || "annual",
            startDate: item.start_date ? item.start_date.slice(0, 10) : "",
            endDate: item.end_date ? item.end_date.slice(0, 10) : "",
            status: item.status || "pending",
            note: item.note || "",
            createdAt: item.created_at || new Date().toISOString(),
          }));
          setPersonLeaves(mappedLeaves);
        }
      })
      .catch(() => {
        setPerson(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!isAdmin) return null;

  if (!person) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center gap-4 rounded-xl p-16 text-center">
        <p className="text-base text-on-surface-variant">
          Personel bulunamadı.
        </p>
        <Link
          href="/personnel"
          className="font-label-mono text-sm text-accent-cyan hover:underline"
        >
          ← Personel listesine dön
        </Link>
      </div>
    );
  }

  const infoRows = [
    { icon: Briefcase, label: "Departman", value: person.department },
    { icon: Phone, label: "Telefon", value: person.phone },
    { icon: Mail, label: "E-posta", value: person.email ?? "—" },
    {
      icon: CalendarDays,
      label: "Başlangıç",
      value: person.startDate ? formatDate(person.startDate) : "—",
    },
  ];

  return (
    <>
      <Link
        href="/personnel"
        className="mb-6 inline-flex items-center gap-2 font-label-mono text-sm text-on-surface-variant transition-colors hover:text-accent-cyan"
      >
        <ArrowLeft className="size-4" />
        Personel Listesi
      </Link>

      {/* Header / info card */}
      <div className="glass-panel mb-6 rounded-xl p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <Avatar
            name={person.name}
            url={person.avatarUrl}
            className="size-14 shrink-0 border border-white/10 text-lg sm:size-20"
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl lg:text-4xl">
              {person.name}
            </h2>
            <div className="mt-2">
              <PersonnelStatusBadge status={person.status} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-surface-2/40 p-4"
            >
              <div className="mb-1 flex items-center gap-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                <Icon className="size-4" />
                {label}
              </div>
              <p className="text-base text-on-surface">{value}</p>
            </div>
          ))}
        </div>
      </div>



      {/* Leave history */}
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="text-xl font-bold text-on-surface sm:text-2xl">
            Kullandığı İzinler
          </h3>
          <p className="font-label-mono text-xs text-on-surface-variant/70">
            {personLeaves.length} kayıt
          </p>
        </div>

        {personLeaves.length === 0 ? (
          <p className="p-10 text-center text-base text-on-surface-variant">
            Bu personelin izin kaydı yok.
          </p>
        ) : (
          <>
          {/* Mobil: kart listesi */}
          <MobileCardList className="p-4">
            {personLeaves.map((l) => (
              <MobileCard
                key={l.id}
                title={leaveTypeLabels[l.type]}
                badge={<LeaveStatusBadge status={l.status} />}
                rows={[
                  { label: "Başlangıç", value: formatDate(l.startDate) },
                  { label: "Bitiş", value: formatDate(l.endDate) },
                  {
                    label: "Gün",
                    value: (
                      <span className="font-label-mono">
                        {workingDayCount(l.startDate, l.endDate)}
                      </span>
                    ),
                  },
                ]}
              />
            ))}
          </MobileCardList>

          {/* Masaüstü: tablo */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-white/10 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 font-medium">İzin Türü</th>
                  <th className="px-6 py-4 font-medium">Başlangıç</th>
                  <th className="px-6 py-4 font-medium">Bitiş</th>
                  <th className="px-6 py-4 font-medium">Gün</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {personLeaves.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-on-surface">
                      {leaveTypeLabels[l.type]}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {formatDate(l.startDate)}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {formatDate(l.endDate)}
                    </td>
                    <td className="px-6 py-4 font-label-mono text-on-surface-variant">
                      {workingDayCount(l.startDate, l.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <LeaveStatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </>
  );
}

export default function PersonnelDetailPage() {
  return (
    <Suspense fallback={null}>
      <PersonnelDetail />
    </Suspense>
  );
}
