"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      footer="Hesabınız yoksa İK yöneticinizle iletişime geçin."
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${authFieldClasses} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors cursor-pointer"
              title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            className="h-auto w-full rounded-lg bg-[#7b1e2b] py-2.5 text-sm font-semibold text-white hover:bg-[#5a1622] transition-colors"
          >
            Giriş Yap
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-[#7b1e2b] hover:text-[#5a1622] hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
