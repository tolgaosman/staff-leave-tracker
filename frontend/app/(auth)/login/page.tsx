"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound } from "lucide-react";

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
      toast.success("Giriş Başarılı", `${email} hesabı ile sisteme giriş yapıldı.`);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "E-posta veya şifreniz hatalı.";
      toast.error("Giriş Yapılamadı", msg);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8 lg:relative lg:block">
      {/* Login Kutusu - ekranın tam ortasında (yatay + dikey) */}
      <div className="w-full max-w-md shrink-0 lg:mx-auto">
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
      </div>

      {/* Örnek Girişler - login kutusunun hemen yanında, onunla aynı dikey eksende */}
      <div className="w-full max-w-sm lg:absolute lg:left-[calc(50%_+_14rem_+_2rem)] lg:top-1/2 lg:-translate-y-1/2">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/40 bg-white/50 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-2 border-b border-white/40 pb-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-accent-cyan/10">
                <KeyRound className="size-4 text-accent-cyan" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                Örnek Hesaplar
              </h3>
            </div>
            
            <div className="space-y-4">
              
              <div className="group rounded-xl bg-white/70 p-4 border border-white transition-all hover:bg-white hover:shadow-md">
                <p className="font-bold text-sm text-slate-800 mb-1">Leora Nader <span className="font-medium text-xs text-slate-500">(Bilgi İşlem Müdürü)</span></p>
                <div className="space-y-1 text-xs font-mono text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                  <p>E: leora.nader5970@test.com</p>
                  <p>Ş: 12345678</p>
                </div>
                <button 
                  onClick={() => { setEmail('leora.nader5970@test.com'); setPassword('12345678'); }} 
                  className="mt-3 w-full rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-accent-cyan hover:text-white"
                >
                  Bilgileri Doldur
                </button>
              </div>

              <div className="group rounded-xl bg-white/70 p-4 border border-white transition-all hover:bg-white hover:shadow-md">
                <p className="font-bold text-sm text-slate-800 mb-1">Monroe Stracke <span className="font-medium text-xs text-slate-500">(Bilgi İşlem Uzmanı)</span></p>
                <div className="space-y-1 text-xs font-mono text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                  <p>E: monroe.stracke7386@test.com</p>
                  <p>Ş: 12345678</p>
                </div>
                <button 
                  onClick={() => { setEmail('monroe.stracke7386@test.com'); setPassword('12345678'); }} 
                  className="mt-3 w-full rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-accent-cyan hover:text-white"
                >
                  Bilgileri Doldur
                </button>
              </div>

              <div className="group rounded-xl bg-red-50/80 p-4 border border-red-100 transition-all hover:bg-red-50 hover:shadow-md">
                <div className="mb-2">
                  <p className="font-bold text-sm text-[#7b1e2b]">Sistem Yöneticisi <span className="font-medium text-xs text-[#7b1e2b]/70">(Admin)</span></p>
                </div>
                <p className="text-xs text-[#7b1e2b]/80 mb-3 leading-relaxed">
                  Tüm yetkilere sahip ana denetim hesabıdır. Yeni personel ekleyebilir, izinleri onaylayabilir ve duyurular yayınlayabilir.
                </p>
                <div className="space-y-1 text-xs font-mono text-[#7b1e2b]/90 bg-white/60 p-2 rounded-lg border border-red-100">
                  <p>E: admin@test.com</p>
                  <p>Ş: password</p>
                </div>
                <button 
                  onClick={() => { setEmail('admin@test.com'); setPassword('password'); }} 
                  className="mt-3 w-full rounded-lg bg-[#7b1e2b]/10 py-2 text-xs font-bold text-[#7b1e2b] transition-all hover:bg-[#7b1e2b] hover:text-white"
                >
                  Bilgileri Doldur
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
