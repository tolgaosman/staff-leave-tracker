"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/auth-provider";

/* Rol bazlı görünüm kontrolü. Giriş yapan kullanıcının role alanından 
   ve/veya manuel simülasyondan beslenir. */

export type RoleOption = "super_admin" | "hr_admin" | "employee" | string; // string allows "manager:id"

const STORAGE_KEY = "izin-takip-role";

let simulatedRole: RoleOption | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as RoleOption | null;
    if (stored) {
      simulatedRole = stored;
    }
  } catch {
    // ignore
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): RoleOption | null {
  ensureInit();
  return simulatedRole;
}

function getServerSnapshot(): RoleOption | null {
  return null;
}

export const useRoleStore = () => {
  const role = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  const setSimulatedRole = (next: RoleOption | null) => {
    simulatedRole = next;
    initialized = true;
    try {
      if (next === null) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  };

  return { simulatedRole: role, setSimulatedRole };
};

/**
 * Mevcut rolü hesaplar.
 * Eğer kullanıcı super_admin ise ve bir rol simüle ediyorsa onu döndürür.
 * Değilse kullanıcının kendi rolünü döndürür.
 * Kullanıcı giriş yapmamışsa "employee" döner.
 */
export function useRole(): RoleOption {
  const { user } = useAuth();
  const { simulatedRole } = useRoleStore();

  if (!user) return "employee";

  if (user.role === 'super_admin' && simulatedRole) {
    return simulatedRole;
  }

  // Manager: Varsayılan olarak "employee" (kişisel görünüm). 
  // Sadece eğer açıkça "manager" seçilmişse manager rolüne geçer.
  if (user.role === 'manager') {
    if (simulatedRole === 'manager') return 'manager';
    return 'employee';
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
