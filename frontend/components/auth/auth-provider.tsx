"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";
import { clearSimulatedRole } from "@/components/auth/simulated-role-storage";

const STORAGE_KEY = "izin-takip-auth";

export type User = {
  name: string;
  email: string;
  role: "super_admin" | "hr_admin" | "manager" | "employee";
  avatarUrl?: string;
  /* ── Kişisel profil alanları (tamamı isteğe bağlı, /profile'dan düzenlenir) ── */
  /** Ünvan / görev tanımı, ör. "Kıdemli Yazılım Geliştirici" */
  title?: string;
  phone?: string;
  /** ISO yyyy-mm-dd */
  birthDate?: string;
  /** Şehir / çalışma konumu */
  location?: string;
  /** Kısa "hakkımda" metni */
  bio?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
};

/* ── Module-level store (hydration-safe via useSyncExternalStore) ── */

let currentUser: User | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) currentUser = JSON.parse(stored) as User;
  } catch {
    // ignore malformed/unavailable storage
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): User | null {
  ensureInit();
  return currentUser;
}

function getServerSnapshot(): User | null {
  return null;
}

function setUser(next: User | null) {
  currentUser = next;
  initialized = true;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  listeners.forEach((l) => l());
}

/** Ham API User nesnesini frontend User tipine çevirir. */
function mapApiUser(apiUser: any): User {
  if (!apiUser) return apiUser;
  return {
    ...apiUser,
    phone: apiUser.phone ?? apiUser.personnel?.phone,
    title: apiUser.title ?? apiUser.personnel?.title,
    birthDate: apiUser.birth_date ?? apiUser.birthDate,
    avatarUrl: apiUser.avatar_url ?? apiUser.personnel?.avatar_url ?? apiUser.avatarUrl,
    emergencyName: apiUser.emergency_name ?? apiUser.emergencyName,
    emergencyRelation: apiUser.emergency_relation ?? apiUser.emergencyRelation,
    emergencyPhone: apiUser.emergency_phone ?? apiUser.emergencyPhone,
    role: apiUser.role || "employee",
  };
}

/* ── Public API ── */

type AuthContextValue = {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const loginAction = async (email: string, password?: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
    }
    // Yeni oturum her zaman kullanıcının GERÇEK rolüyle başlasın; önceki
    // kullanıcıdan kalan simülasyon değeri sızmasın.
    clearSimulatedRole();
    setUser(mapApiUser(data.user));
  };

  /* NOT: Kendi kendine kayıt (signup) bilinçli olarak yoktur — backend'de
     herkese açık /register rotası kaldırıldı. Hesapları İK/Sistem Yöneticisi
     POST /personnel ile açar; kullanıcı şifresini /forgot-password ile belirler. */

  const logoutAction = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    clearSimulatedRole();
    setUser(null);
  };

  const updateUserAction = async (patch: Partial<User>) => {
    const body: any = { ...patch };
    if ('birthDate' in patch) body.birth_date = patch.birthDate;
    if ('avatarUrl' in patch) body.avatar_url = patch.avatarUrl;
    if ('emergencyName' in patch) body.emergency_name = patch.emergencyName;
    if ('emergencyRelation' in patch) body.emergency_relation = patch.emergencyRelation;
    if ('emergencyPhone' in patch) body.emergency_phone = patch.emergencyPhone;

    const updated = await apiFetch<any>("/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    setUser(mapApiUser(updated));
  };

  const actions = useMemo(
    () => ({
      login: loginAction,
      logout: logoutAction,
      updateUser: updateUserAction,
    }),
    [user]
  );

  return <AuthContext.Provider value={{ user, ...actions }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
