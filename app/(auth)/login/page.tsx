"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AuthCard,
  authFieldClasses,
  authLabelClasses,
} from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login(email, password);
      toast.success("Giriş yapıldı");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Giriş başarısız";
      toast.error(msg);
    }
  }

  return (
    <AuthCard
      title="Giriş Yap"
      subtitle="Hesabınıza erişmek için giriş yapın."
      footer="Demo ortamı — herhangi bir e-posta ile giriş yapabilirsiniz."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={authLabelClasses}>
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@sirket.com"
            className={authFieldClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={authLabelClasses}>
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={authFieldClasses}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            className="h-auto w-full bg-accent-cyan py-3 text-base font-bold text-white hover:bg-accent-cyan/90"
          >
            Giriş Yap
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-accent-cyan hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
