"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnouncementsPanel } from "@/components/dashboard/announcements-panel";
import { useHasDashboardAccess } from "@/components/auth/role-store";

export default function AnnouncementsPage() {
  const hasAccess = useHasDashboardAccess();
  const router = useRouter();

  // Çalışan rolü bu sayfaya doğrudan giremez, dashboard'a yönlendir.
  useEffect(() => {
    if (!hasAccess) {
      router.replace("/");
    }
  }, [hasAccess, router]);

  if (!hasAccess) return null;

  return (
    <div className="space-y-8">
      <div className="border-b border-outline-variant/20 pb-6">
        <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
          Duyuru Oluşturma
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-2 md:text-base">
          Tüm çalışanların ana sayfasında görünecek genel duyuruları buradan yönetebilirsiniz.
        </p>
      </div>

      <div className="max-w-4xl">
        <AnnouncementsPanel />
      </div>
    </div>
  );
}
