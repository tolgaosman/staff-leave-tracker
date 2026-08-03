import { CalendarDays, ClipboardCheck, Users } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const features = [
  { icon: Users, text: "Personel kayıtları tek yerde" },
  { icon: CalendarDays, text: "İzinleri takvim üzerinde gör" },
  { icon: ClipboardCheck, text: "Yıllık izin bakiyesi otomatik hesaplansın" },
];

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:block">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${basePath}/assets/logoLight.png`}
          alt="İzin Takip Sistemi Logo"
          className="h-16 w-16 object-contain dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${basePath}/assets/logoDark.png`}
          alt="İzin Takip Sistemi Logo"
          className="hidden h-16 w-16 object-contain dark:block"
        />
        <div>
          <h1 className="font-serif text-3xl font-bold leading-tight text-primary">
            İzin Takip
          </h1>
          <p className="font-label-mono text-xs uppercase tracking-widest text-on-surface-variant">
            Sistemi
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-sm text-base leading-relaxed text-on-surface-variant">
        Ekibinizin yıllık izinlerini, mazeret ve rapor günlerini tek ekrandan
        takip edin.
      </p>

      <ul className="mt-8 space-y-4">
        {features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-border">
              <Icon className="h-4 w-4 text-accent-cyan" />
            </span>
            <span className="text-base text-on-surface">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
