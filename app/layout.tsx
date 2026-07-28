import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AppToastProvider } from "@/components/ui/toast";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* ── Content Security Policy ──────────────────────────────────────────────
   Statik export'ta (GitHub Pages) sunucu olmadığı için gerçek HTTP başlığı
   gönderilemez; bu yüzden CSP <meta> etiketiyle verilir.

   Notlar:
   - script-src 'unsafe-inline' zorunlu: Next.js hydration için satır içi
     <script> üretir ve statik export'ta nonce üretilemez. Bu nedenle CSP tek
     başına XSS'i durdurmaz — asıl koruma kod tabanında hiç XSS sink'i
     (dangerouslySetInnerHTML/eval) bulunmaması ve ek dosyaların
     sandbox'lanmasıdır. CSP burada derinlemesine savunma katmanıdır:
     veri sızdırmayı (connect-src), yabancı çerçeveleri (frame-src) ve
     eklentileri (object-src) kısıtlar.
   - frame-ancestors <meta> ile ÇALIŞMAZ (tarayıcı yok sayar). Clickjacking'e
     karşı tam koruma için backend/CDN'den X-Frame-Options veya
     frame-ancestors başlığı gönderilmelidir. */
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").origin;
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: ${apiOrigin}`.trim(),
  `connect-src 'self' ${apiOrigin}`.trim(),
  // Ek (rapor/dilekçe) PDF görüntüleyici; iframe ayrıca sandbox'lıdır.
  `frame-src 'self' data: blob: ${apiOrigin}`.trim(),
].join("; ");

export const metadata: Metadata = {
  title: "İzin Takip Sistemi",
  description: "İzin Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased ubuntu-light"
      suppressHydrationWarning
    >
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <AppToastProvider>{children}</AppToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
