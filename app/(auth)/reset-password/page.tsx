"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ 
          token, 
          email, 
          password, 
          password_confirmation: passwordConfirmation 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "İşlem başarısız");
      }

      setSuccess(true);
      toast.success(data.message || "Şifreniz başarıyla sıfırlandı");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center text-primary">
          <p className="mb-2 font-semibold">Şifre sıfırlandı!</p>
          <p className="text-sm text-on-surface-variant">Yeni şifrenizle sisteme giriş yapabilirsiniz.</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Giriş Yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Yeni Şifre Belirle</h1>
        <p className="text-on-surface-variant">
          Lütfen hesabınız için yeni bir şifre girin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none text-on-surface">
            E-posta
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="border-outline bg-surface text-on-surface focus-visible:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium leading-none text-on-surface">
            Yeni Şifre
          </label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="border-outline bg-surface text-on-surface focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password_confirmation" className="text-sm font-medium leading-none text-on-surface">
            Yeni Şifre (Tekrar)
          </label>
          <Input
            id="password_confirmation"
            type="password"
            required
            minLength={8}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            disabled={loading}
            className="border-outline bg-surface text-on-surface focus-visible:ring-primary"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sıfırlanıyor..." : "Şifreyi Sıfırla"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <LogIn className="size-4" />
          Giriş ekranına dön
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex w-full items-center justify-center p-8 text-on-surface-variant">Yükleniyor...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
