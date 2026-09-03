"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnouncementsPanel } from "@/components/dashboard/announcements-panel";
import { CreateAnnouncementForm } from "@/components/dashboard/create-announcement-form";
import { useHasDashboardAccess } from "@/components/auth/role-store";

export default function AnnouncementsPage() {
  const hasAccess = useHasDashboardAccess();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!hasAccess) {
      router.replace("/");
    }
  }, [hasAccess, router]);

  if (!hasAccess) return null;

  return (
    <div className="space-y-8 flex flex-col">
      <div className="border-b border-outline-variant/20 pb-6 w-full">
        <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
          Duyurular
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
          Tüm çalışanların ana sayfasında görünecek genel ve planlanmış duyuruları buradan yönetebilirsiniz.
        </p>
      </div>

      <div className="w-full space-y-8">
        {/* Üst Alan: Sol Form, Sağ Gelecek Duyurular */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <CreateAnnouncementForm onCreated={() => setRefreshKey((prev) => prev + 1)} />
          <AnnouncementsPanel
            refreshKey={refreshKey}
            allowDelete={true}
            mode="scheduled"
            title="Gelecek Duyuru Planları"
          />
        </div>

        {/* Alt Alan: Mevcut Duyurular */}
        <div>
          <AnnouncementsPanel
            refreshKey={refreshKey}
            allowDelete={true}
            mode="active"
            title="Mevcut Duyurular"
          />
        </div>
      </div>
    </div>
  );
}
