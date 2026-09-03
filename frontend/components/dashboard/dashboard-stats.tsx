"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CircleCheckBig, Building2, Users } from "lucide-react";

import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import type { LeaveRequest, Personnel } from "@/lib/data/types";

export function DashboardStats({
  personnel,
  requests,
}: {
  personnel: Personnel[];
  requests: LeaveRequest[];
}) {
  const total_personnel = personnel.length;
  const pending_requests = requests.filter((r) => r.status === "pending").length;
  const active_leaves = personnel.filter((p) => p.status === "on-leave").length;
  const departments_count = new Set(personnel.map((p) => p.departmentId).filter(Boolean)).size;

  const stats: Stat[] = [
    {
      label: "TOPLAM PERSONEL",
      value: String(total_personnel),
      icon: Users,
      accent: "cyan",
      caption: "Kayıtlı Çalışan Sayısı",
    },
    {
      label: "BEKLEYEN TALEPLER",
      value: String(pending_requests),
      icon: CalendarClock,
      accent: "cyan",
      action: "Şimdi İncele",
      actionHref: "/leave-requests",
      highlight: pending_requests > 0,
    },
    {
      label: "GÜNCEL İZİNLİLER",
      value: String(active_leaves),
      icon: CircleCheckBig,
      accent: "violet",
      caption: "Şu An İzinli Personel",
    },
    {
      label: "DEPARTMAN SAYISI",
      value: String(departments_count).padStart(2, "0"),
      icon: Building2,
      accent: "neutral",
      caption: "Aktif Departman Sayısı",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
