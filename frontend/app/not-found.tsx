"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="glass-panel flex max-w-md flex-col items-center rounded-2xl p-8 shadow-xl">
        <h1 className="font-serif text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-3 font-serif text-2xl font-bold text-on-surface">
          Sayfa Bulunamadı
        </h2>
        <p className="mt-2 font-sans text-sm text-on-surface-variant">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 flex items-center gap-2 rounded-lg bg-accent-cyan px-5 py-2.5 font-sans text-sm font-bold text-white shadow transition-all hover:opacity-90 active:scale-95"
        >
          <Home className="size-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
}
