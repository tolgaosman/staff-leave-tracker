"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useState } from "react";

/* Ek dosyalar kullanıcı tarafından yüklenir; url/name GÜVENİLMEZ girdidir.
   Bu yüzden: (1) yalnızca http(s) ve güvenli data: türlerine izin verilir —
   javascript:/data:text/html gibi şemalar engellenir, (2) PDF görüntüleyici
   sandbox'lanır, böylece gömülen içerik script çalıştıramaz, form gönderemez
   veya üst pencereyi başka bir adrese yönlendiremez. */

function isSafeUrl(url: string): boolean {
  const v = url.trim().toLowerCase();
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  // Yalnızca zararsız gömme türleri; data:text/html ve data:image/svg+xml script çalıştırabilir.
  return (
    v.startsWith("data:application/pdf;") ||
    v.startsWith("data:image/png;") ||
    v.startsWith("data:image/jpeg;") ||
    v.startsWith("data:image/jpg;") ||
    v.startsWith("data:image/gif;") ||
    v.startsWith("data:image/webp;")
  );
}

/* Backend bazı durumlarda mutlak URL yerine göreli bir yol dönebiliyor
   (ör. "/storage/attachments/x.png"). Böyle bir yol tarayıcıda frontend
   origin'ine (localhost:3000) göre çözülür ve 404 verir — oysa dosya API
   origin'inde durur. Bu yüzden göreli yolları API origin'iyle birleştiriyoruz.
   Kaynak lib/api.ts ile aynı: NEXT_PUBLIC_API_URL (varsayılan localhost:8000). */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").origin;
  } catch {
    return "";
  }
})();

function normalizeUrl(rawUrl: string): string {
  if (!rawUrl) return "";

  // Yinelenen /storage/ segmentlerini temizle (eski kayıtlardaki bozukluk).
  const cleaned = rawUrl
    .replace(/\/storage\/\/storage\//g, "/storage/")
    .replace(/\/storage\/storage\//g, "/storage/");

  // Yalnızca kök-göreli yollar mutlaklaştırılır. "//evil.com" gibi
  // protokol-göreli (protocol-relative) değerler BİLEREK dışarıda bırakılır:
  // aksi halde başka bir origin'e işaret edebilirlerdi.
  if (cleaned.startsWith("/") && !cleaned.startsWith("//")) {
    return `${API_ORIGIN}${cleaned}`;
  }

  return cleaned;
}

function FileViewer({
  url,
  name,
  label,
}: {
  url: string;
  name?: string;
  label: string;
}) {
  const cleanUrl = normalizeUrl(url);

  if (!isSafeUrl(cleanUrl)) {
    return (
      <p className="p-4 text-center text-sm text-on-surface-variant">
        Bu ek görüntülenemiyor (desteklenmeyen veya güvenli olmayan dosya biçimi).
      </p>
    );
  }

  const lower = (name ?? cleanUrl).toLowerCase();
  const isPdf = lower.endsWith(".pdf") || lower.startsWith("data:application/pdf;");

  if (isPdf) {
    return (
      <iframe
        src={cleanUrl}
        // Boş sandbox = tüm ayrıcalıklar kapalı (script, form, top-navigation yok).
        // Tarayıcının yerleşik PDF görüntüleyicisi bundan etkilenmez.
        sandbox=""
        referrerPolicy="no-referrer"
        className="h-full w-full rounded-lg border-none bg-white"
        title={`${label} Görüntüleyici`}
      />
    );
  }

  // Images (jpg, png, gif, webp, etc.)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanUrl}
      alt={label}
      referrerPolicy="no-referrer"
      className="mx-auto max-h-full max-w-full rounded-lg object-contain"
    />
  );
}

export function AttachmentDialog({
  url,
  name,
  label = "Doktor Raporu",
  children,
}: {
  url: string;
  name?: string;
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </span>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-white/10 bg-surface-1 shadow-2xl outline-none">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <Dialog.Title className="truncate text-xl font-bold text-on-surface">
                {label}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Kapat"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <FileViewer url={url} name={name} label={label} />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
