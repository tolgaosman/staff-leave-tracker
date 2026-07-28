"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
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
      const msg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Şifremi Unuttum</h1>
        <p className="text-on-surface-variant">
          Hesabınıza ait e-posta adresini girin. Size bir şifre sıfırlama bağlantısı göndereceğiz.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none text-on-surface">
              E-posta
            </label>
            <Input
              id="email"
              type="email"
              placeholder="isim@sirket.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="border-outline bg-surface text-on-surface focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center text-primary">
          <p className="mb-2 font-semibold">Bağlantı gönderildi!</p>
          <p className="text-sm text-on-surface-variant">Lütfen e-posta kutunuzu kontrol edin ve gelen bağlantıya tıklayarak şifrenizi sıfırlayın.</p>
        </div>
      )}

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
