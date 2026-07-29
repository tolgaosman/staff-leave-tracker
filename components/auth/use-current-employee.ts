"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api";
import type { Personnel } from "@/lib/data/types";

/** Ham API personel satırını domain `Personnel`'e çevirir. */
function mapPersonnel(p: any): Personnel {
  return {
    id: String(p.id),
    name: p.name,
    department: p.department?.name ?? (p.department_id ? "Genel" : "-"),
    departmentId: p.department_id != null ? String(p.department_id) : undefined,
    phone: p.phone ?? "-",
    status: p.status ?? "active",
    startDate: p.start_date ?? "",
    avatarUrl: p.user?.avatar_url || p.avatar_url || "",
    email: p.user?.email ?? "",
    role: p.user?.role || "employee",
    title: p.user?.title || p.title || "",
    annualLeaveBalance: p.annual_leave_balance != null ? Number(p.annual_leave_balance) : undefined,
    carriedOverBalance: p.carried_over_balance != null ? Number(p.carried_over_balance) : 0,
  };
}

/**
 * Giriş yapan kullanıcıyı (auth) bir personel kaydıyla e-posta üzerinden
 * eşleştirir — çalışan (bireysel) görünümde "ben" kimliğini belirler.
 *
 * `GET /personnel` (backend `user` ilişkisini eager-load eder) çekilir ve
 * `personnel.user.email` auth e-postasıyla karşılaştırılır. Eşleşme yoksa
 * `me` undefined döner. `loading` ilk çekim tamamlanana kadar true kalır ki
 * çağıran taraf "kayıt yok" uyarısını erken göstermesin.
 */
export function useCurrentEmployee(): { me: Personnel | undefined; loading: boolean } {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase().trim() ?? "";

  const [me, setMe] = useState<Personnel | undefined>(undefined);
  // E-posta yoksa çekilecek bir şey de yok → baştan yükleme bitmiş sayılır.
  const [loading, setLoading] = useState<boolean>(() => Boolean(email));

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    apiFetch<any>("/me")
      .then((data) => {
        if (cancelled) return;
        if (data && data.personnel) {
          const p = data.personnel;
          p.user = data; // mapPersonnel p.user.email beklediği için ekliyoruz
          setMe(mapPersonnel(p));
        } else {
          setMe(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setMe(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  return { me, loading };
}
