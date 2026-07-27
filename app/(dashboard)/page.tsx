"use client";

import { useEffect, useState } from "react";

import { useIsAdmin } from "@/components/auth/role-store";
import { apiFetch } from "@/lib/api";
import type { LeaveRequest, LeaveType, Personnel } from "@/lib/data/types";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { LeaveDistributionChart } from "@/components/dashboard/leave-distribution-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OnLeaveTable } from "@/components/dashboard/on-leave-table";

/** Ham API personel satırını domain `Personnel`'e çevirir. */
function mapPersonnel(p: any): Personnel {
  return {
    id: String(p.id),
    name: p.name,
    department: p.department?.name ?? "Genel",
    departmentId: p.department_id != null ? String(p.department_id) : undefined,
    phone: p.phone ?? "-",
    status: p.status ?? "active",
    startDate: p.start_date ?? "",
    avatarUrl: p.avatar_url ?? "",
    email: p.user?.email ?? "",
  };
}

/** Ham API izin satırını domain `LeaveRequest`'e çevirir. */
function mapLeave(it: any): LeaveRequest {
  return {
    id: String(it.id),
    personnelId: String(it.personnel_id),
    type: (it.leave_type?.slug as LeaveType) ?? "annual",
    startDate: it.start_date ? String(it.start_date).slice(0, 10) : "",
    endDate: it.end_date ? String(it.end_date).slice(0, 10) : "",
    status: it.status ?? "pending",
    note: it.note ?? "",
    rejectionReason: it.rejection_reason ?? undefined,
    createdAt: it.created_at ?? "",
    decidedAt: it.decided_at ?? undefined,
    attachmentUrl: it.attachment_url ?? undefined,
  };
}

/* Yönetici (admin) şirket-geneli paneli — veriyi bir kez çekip alt bileşenlere
   prop olarak geçirir (üç ayrı fetch yerine tek çağrı). */
function AdminOverview() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>("/personnel"),
      apiFetch<any[]>("/leave-requests"),
    ])
      .then(([pers, reqs]) => {
        setPersonnel(pers.map(mapPersonnel));
        setRequests(reqs.map(mapLeave));
      })
      .catch(() => {
        // sessiz — bileşenler boş durum gösterir
      });
  }, []);

  return (
    <>
      <div className="mb-8 md:mb-12">
        <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
          Personel Genel Bakış
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
          Ekibinizin dinlenme ve katılım durumlarına bütünsel bir bakış. İzin taleplerini hak ettikleri özenle yönetin.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Chart + activity */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeaveDistributionChart requests={requests} />
        </div>
        <RecentActivity requests={requests} personnel={personnel} />
      </div>

      {/* On Leave Table */}
      <div className="mb-8">
        <OnLeaveTable personnel={personnel} requests={requests} />
      </div>
    </>
  );
}

export default function IzinTakipDashboard() {
  const isAdmin = useIsAdmin();

  // Çalışan rolü: şirket-geneli panel yerine kişisel (bireysel) panel.
  if (!isAdmin) return <EmployeeDashboard />;

  return <AdminOverview />;
}
