"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getSimulatedRoleServerSnapshot,
  getSimulatedRoleSnapshot,
  setSimulatedRole,
  subscribeSimulatedRole,
  type RoleOption,
} from "@/components/auth/simulated-role-storage";

/* Rol bazlı görünüm kontrolü. Giriş yapan kullanıcının role alanından
   ve/veya manuel simülasyondan beslenir.
   Saklama katmanı simulated-role-storage.ts'te (döngüsel import olmasın diye). */

export type { RoleOption };
export { setSimulatedRole, clearSimulatedRole } from "@/components/auth/simulated-role-storage";

export const useRoleStore = () => {
  const role = useSyncExternalStore(
    subscribeSimulatedRole,
    getSimulatedRoleSnapshot,
    getSimulatedRoleServerSnapshot
  );

  return { simulatedRole: role, setSimulatedRole };
};

/**
 * Bir simülasyon değerinin, kullanıcının GERÇEK rolü için meşru olup olmadığı.
 * role-switcher.tsx'in sunduğu seçeneklerle aynı kuralı ifade eder; tek
 * doğruluk kaynağı burasıdır, o liste bununla tutarlı kalmalıdır.
 *
 *   super_admin → "super_admin" | "manager:<id>"
 *   manager     → "employee" | "manager"
 *   diğerleri   → simülasyon yok
 *
 * Bayat ya da elle düzenlenmiş bir localStorage değeri (ör. super_admin için
 * "employee") böylece yok sayılır ve kullanıcı gerçek rolüne döner.
 */
function isValidSimulation(realRole: string, simulated: RoleOption | null): boolean {
  if (!simulated) return false;

  if (realRole === "super_admin") {
    return simulated === "super_admin" || simulated.startsWith("manager:");
  }

  if (realRole === "manager") {
    return simulated === "employee" || simulated === "manager";
  }

  return false;
}

/**
 * Mevcut rolü hesaplar.
 * Eğer kullanıcı super_admin ise ve GEÇERLİ bir rol simüle ediyorsa onu döndürür.
 * Değilse kullanıcının kendi rolünü döndürür.
 * Kullanıcı giriş yapmamışsa "employee" döner.
 */
export function useRole(): RoleOption {
  const { user } = useAuth();
  const { simulatedRole } = useRoleStore();

  if (!user) return "employee";

  const simulation = isValidSimulation(user.role, simulatedRole) ? simulatedRole : null;

  if (user.role === 'super_admin') {
    return simulation ?? user.role;
  }

  if (user.role === 'manager') {
    return simulation === 'employee' ? 'employee' : 'manager';
  }

  // user.role is 'employee' or 'hr_admin'
  return user.role;
}

/**
 * Geriye dönük uyumluluk için (eski useIsAdmin kullanan yerler için)
 * Sadece super_admin ve hr_admin tam admin yetkilerine sahiptir (personel düzenleme vs.)
 */
export function useIsAdmin(): boolean {
  const role = useRole();
  return role === "super_admin" || role === "hr_admin";
}

/**
 * Sol menüyü ve dashboard sekmelerini (Personel, İzinler vb.) görebilecek yetkiler:
 * super_admin, hr_admin, manager
 */
export function useHasDashboardAccess(): boolean {
  const role = useRole();
  return role === "super_admin" || role === "hr_admin" || role.startsWith("manager");
}
