"use client";

import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

/* Uygulama geneli toast (bildirim) altyapısı.
   İkon Kuralları:
   1) Yeşil Tik (CheckCircle2): Onaylama, oluşturma, başarım vb. olumlu işlemler
   2) Kırmızı Çarpı (XCircle): İzin reddi, silme vb. olumsuz işlemler
   3) Sarı Üçgen Ünlem (AlertTriangle): Hata, arıza, eksik bilgi ve aksaklıklar
*/

/** Başlık (+ opsiyonel açıklama) için ortak içerik. */
function content(title: string, description?: string) {
  if (!description) {
    return <span className="font-sans text-sm font-bold leading-tight">{title}</span>;
  }
  return (
    <span className="flex flex-col">
      <span className="font-sans text-sm font-bold leading-tight">{title}</span>
      <span className="mt-0.5 font-sans text-xs opacity-80">{description}</span>
    </span>
  );
}

export function useToast() {
  return {
    /** Yeşil Tik: Olumlu ve başarılı işlemler (onaylama, ekleme, kaydetme) */
    success: (title: string, description?: string) =>
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } flex items-center gap-3.5 rounded-xl border border-emerald-500/25 bg-surface-1 p-4 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-4 ring-emerald-500/5">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-on-surface">
              {content(title, description)}
            </div>
          </div>
        ),
        { duration: 4000 }
      ),

    /** Kırmızı Çarpı: Olumsuz işlemler (red, silme vb.) */
    reject: (title: string, description?: string) =>
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } flex items-center gap-3.5 rounded-xl border border-rose-500/25 bg-surface-1 p-4 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 ring-4 ring-rose-500/5">
              <XCircle className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-on-surface">
              {content(title, description)}
            </div>
          </div>
        ),
        { duration: 4000 }
      ),

    /** Sarı Üçgen Ünlem: Hata, arıza, uyarı ve aksaklıklar */
    error: (title: string, description?: string) => {
      // Eğer başlık veya açıklama "reddedildi" ya da "silindi" içeriyorsa Kırmızı Çarpı göster
      const isNegativeAction = /reddedildi|silindi|kaldırıldı/i.test(
        title + (description || "")
      );

      if (isNegativeAction) {
        return toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } flex items-center gap-3.5 rounded-xl border border-rose-500/25 bg-surface-1 p-4 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 ring-4 ring-rose-500/5">
                <XCircle className="size-5" />
              </div>
              <div className="min-w-0 flex-1 text-on-surface">
                {content(title, description)}
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      }

      return toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } flex items-center gap-3.5 rounded-xl border border-amber-500/25 bg-surface-1 p-4 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 ring-4 ring-amber-500/5">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-on-surface">
              {content(title, description)}
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    },

    /** Mavi Bilgi İkonu */
    info: (title: string, description?: string) =>
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } flex items-center gap-3.5 rounded-xl border border-cyan-500/25 bg-surface-1 p-4 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500 ring-4 ring-cyan-500/5">
              <Info className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-on-surface">
              {content(title, description)}
            </div>
          </div>
        ),
        { duration: 4000 }
      ),
  };
}

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
    </>
  );
}
