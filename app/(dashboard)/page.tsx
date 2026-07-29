"use client";

import { useEffect, useState } from "react";

import { useHasDashboardAccess, useIsAdmin, useRoleStore } from "@/components/auth/role-store";
import { apiFetch } from "@/lib/api";
import type { LeaveRequest, LeaveType, Personnel } from "@/lib/data/types";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { LeaveDistributionChart } from "@/components/dashboard/leave-distribution-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OnLeaveTable } from "@/components/dashboard/on-leave-table";
import { AnnouncementsPanel } from "@/components/dashboard/announcements-panel";

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
    avatarUrl: p.user?.avatar_url || p.avatar_url || "",
    email: p.user?.email ?? "",
    role: p.user?.role || "employee",
    title: p.user?.title || p.title || "",
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

/* Yönetici (admin) şirket-geneli paneli */
function AdminOverview() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const { simulatedRole } = useRoleStore();

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>("/personnel"),
      apiFetch<any[]>("/leave-requests"),
    ])
      .then(([pers, reqs]) => {
        let mappedPers = pers.map(mapPersonnel);
        let mappedReqs = reqs.map(mapLeave);

        if (simulatedRole && simulatedRole.startsWith("manager:")) {
          const simulatedDeptId = simulatedRole.split(":")[1];
          mappedPers = mappedPers.filter((p) => p.departmentId === simulatedDeptId);
          const deptPersonIds = new Set(mappedPers.map((p) => p.id));
          mappedReqs = mappedReqs.filter((r) => deptPersonIds.has(r.personnelId));
        }

        setPersonnel(mappedPers);
        setRequests(mappedReqs);
      })
      .catch(() => {});
  }, [simulatedRole]);

  return (
    <>
      <div className="mb-8 md:mb-12">
        <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
          Personel Genel Bakış
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
          Ekibinizin dinlenme ve katılım durumlarına bütünsel bir bakış.
        </p>
      </div>

      <div className="mb-8">
        <DashboardStats personnel={personnel} requests={requests} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeaveDistributionChart requests={requests} />
        </div>
        <RecentActivity requests={requests} personnel={personnel} />
      </div>

      <div className="mb-8">
        <OnLeaveTable personnel={personnel} requests={requests} />
      </div>

      <div className="mb-8">
        <AnnouncementsPanel />
      </div>
    </>
  );
}

export default function IzinTakipDashboard() {
  const isAdmin = useIsAdmin();

  // Admin → doğrudan yönetim paneli, diğerleri → kişisel görünüm
  if (isAdmin) return <AdminOverview />;

  return (
    <div className="space-y-6">
      <EmployeeDashboard />
      <AnnouncementsPanel />
    </div>
  );
}
