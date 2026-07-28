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
      <div className="border-b border-outline-variant/20 pb-6 w-full max-w-4xl">
        <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
          Duyurular
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
          Tüm çalışanların ana sayfasında görünecek genel duyuruları buradan yönetebilirsiniz.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <CreateAnnouncementForm onCreated={() => setRefreshKey((prev) => prev + 1)} />
        <AnnouncementsPanel refreshKey={refreshKey} />
      </div>
    </div>
  );
}
