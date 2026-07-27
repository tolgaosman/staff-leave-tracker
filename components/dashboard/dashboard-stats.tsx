"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CircleCheckBig, Building2, Users } from "lucide-react";

import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

type ApiStats = {
  total_personnel: number;
  active_leaves: number;
  pending_requests: number;
  departments_count: number;
};

export function DashboardStats() {
  const [data, setData] = useState<ApiStats>({
    total_personnel: 0,
    active_leaves: 0,
    pending_requests: 0,
    departments_count: 0,
  });

  useEffect(() => {
    apiFetch<ApiStats>("/dashboard")
      .then((res) => setData(res))
      .catch(() => {
        // Fallback or handle error quietly
      });
  }, []);

  const stats: Stat[] = [
    {
      label: "TOPLAM PERSONEL",
      value: String(data.total_personnel),
      icon: Users,
      accent: "cyan",
      caption: "Kayıtlı Çalışan Sayısı",
      valueColor: "dark:text-white",
    },
    {
      label: "BEKLEYEN TALEPLER",
      value: String(data.pending_requests),
      icon: CalendarClock,
      accent: "cyan",
      action: "Şimdi İncele",
      actionHref: "/leave-requests",
      highlight: data.pending_requests > 0,
    },
    {
      label: "GÜNCEL İZİNLİLER",
      value: String(data.active_leaves),
      icon: CircleCheckBig,
      accent: "violet",
      caption: "Şu An İzinli Personel",
    },
    {
      label: "DEPARTMAN SAYISI",
      value: String(data.departments_count),
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
