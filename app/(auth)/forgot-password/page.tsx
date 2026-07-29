"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, CheckCircle2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AuthCard,
  authFieldClasses,
  authLabelClasses,
} from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "İşlem başarısız");
      }

      setSubmitted(true);
      toast.success(data.message || "Sıfırlama bağlantısı gönderildi");
    } catch (err: unknown) {
      setSubmitted(true);
      toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Şifremi Unuttum"
      subtitle="E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className={authLabelClasses}>
              E-posta Adresiniz
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@sirket.com"
              disabled={loading}
              className={authFieldClasses}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="h-auto w-full bg-accent-cyan py-3 text-base font-bold text-white hover:bg-accent-cyan/90 disabled:opacity-50"
            >
              {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısını Gönder"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 p-5 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent-cyan/20 text-accent-cyan">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="font-bold text-on-surface">Bağlantı Gönderildi!</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              <span className="font-mono font-semibold">{email}</span> adresine sıfırlama bağlantısı iletildi. Lütfen e-posta kutunuzu kontrol edin.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-cyan hover:underline"
        >
          <LogIn className="size-4" />
          Giriş ekranına dön
        </Link>
      </div>
    </AuthCard>
  );
}
