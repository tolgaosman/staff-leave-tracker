"use client";

/* Simüle edilen görünüm rolünün saklama katmanı (localStorage + abonelik).
 *
 * Neden ayrı bir modül: role-store.ts, useRole() içinde auth-provider'dan
 * useAuth()'u kullanıyor; auth-provider ve lib/api ise oturum değiştiğinde
 * simülasyonu temizlemek zorunda. Hepsi role-store'a bağlansaydı döngüsel
 * import oluşurdu (role-store → auth-provider → role-store). Bu dosyanın
 * hiçbir bağımlılığı yok, dolayısıyla herkes güvenle import edebilir.
 */

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

export function subscribeSimulatedRole(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSimulatedRoleSnapshot(): RoleOption | null {
  ensureInit();
  return simulatedRole;
}

/** SSR/ilk boyamada sabit değer — hydration uyuşmazlığını önler. */
export function getSimulatedRoleServerSnapshot(): RoleOption | null {
  return null;
}

export function setSimulatedRole(next: RoleOption | null) {
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
}

/**
 * Simülasyonu sıfırlar. Oturum değiştiğinde (giriş/çıkış/401) çağrılır:
 * aksi halde localStorage'daki değer bir sonraki kullanıcıya sızar ve örneğin
 * müdür oturumundan kalan "employee" değeri, yeni giren super_admin'i
 * kişisel panele düşürür.
 */
export function clearSimulatedRole() {
  setSimulatedRole(null);
}
