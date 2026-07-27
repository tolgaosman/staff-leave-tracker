"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "izin-takip-auth";

export type User = {
  name: string;
  email: string;
  is_admin?: boolean;
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

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/* ── Public API ── */

type AuthContextValue = {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
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
    setUser(data.user);
  };

  const signupAction = async (name: string, email: string, password?: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password: password || "password123" }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
  };

  const logoutAction = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUser(null);
  };

  const updateUserAction = async (patch: Partial<User>) => {
    const updated = await apiFetch<User>("/me", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    setUser(updated);
  };

  const actions = useMemo(
    () => ({
      login: loginAction,
      signup: signupAction,
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
