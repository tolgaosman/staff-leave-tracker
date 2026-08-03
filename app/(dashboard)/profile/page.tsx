"use client";

import {
  AtSign,
  Cake,
  Camera,
  Check,
  IdCard,
  LifeBuoy,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
  Briefcase,
} from "lucide-react";
import { useState } from "react";

import { useAuth, type User } from "@/components/auth/auth-provider";
import { useRole } from "@/components/auth/role-store";
import { useCurrentEmployee } from "@/components/auth/use-current-employee";
import { Avatar } from "@/components/dashboard/avatar";
import { ImageCropper } from "@/components/dashboard/image-cropper";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { readFile } from "@/lib/image";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 font-sans text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/60 placeholder-on-surface-variant/40";

const labelClasses =
  "font-label-mono text-xs uppercase tracking-wider text-on-surface-variant";

/* ── Düzenlenebilir profil formu ────────────────────────────────────── */

type ProfileForm = {
  name: string;
  title: string;
  phone: string;
  birthDate: string;
  location: string;
  bio: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  avatarUrl: string;
};

function formFromUser(user: User): ProfileForm {
  return {
    name: user.name ?? "",
    title: user.title ?? "",
    phone: user.phone ?? "",
    birthDate: user.birthDate ? String(user.birthDate).slice(0, 10) : "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    emergencyName: user.emergencyName ?? "",
    emergencyRelation: user.emergencyRelation ?? "",
    emergencyPhone: user.emergencyPhone ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}




/* ── Sayfa ──────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { user } = useAuth();
  // Kullanıcı ilk boyamada null (SSR anlık görüntüsü) → form state'i gerçek
  // kullanıcıyla mount edilsin diye alt bileşen e-posta ile anahtarlanır.
  if (!user) return null;
  return <ProfileEditor key={user.email} user={user} />;
}

function ProfileEditor({ user }: { user: User }) {
  const { updateUser } = useAuth();
  const role = useRole();
  const { me } = useCurrentEmployee();
  const toast = useToast();

  const [form, setForm] = useState<ProfileForm>(() => formFromUser(user));
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const roleLabels: Record<string, { label: string; icon: any }> = {
    super_admin: { label: "Sistem Yöneticisi", icon: ShieldCheck },
    hr_admin: { label: "İnsan Kaynakları", icon: ShieldCheck },
    manager: { label: "Departman Müdürü", icon: Briefcase },
    employee: { label: "Çalışan", icon: UserIcon },
  };
  const currentRoleInfo = roleLabels[user.role] ?? roleLabels.employee;
  const RoleIcon = currentRoleInfo.icon;

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const initial = formFromUser(user);
  const dirty = (Object.keys(initial) as (keyof ProfileForm)[]).some(
    (k) => form[k] !== initial[k]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = (v: string) => v.trim() || undefined;
    try {
      await updateUser({
        name: form.name.trim() || user.name,
        title: clean(form.title),
        phone: clean(form.phone),
        birthDate: clean(form.birthDate),
        location: clean(form.location),
        bio: clean(form.bio),
        emergencyName: clean(form.emergencyName),
        emergencyRelation: clean(form.emergencyRelation),
        emergencyPhone: clean(form.emergencyPhone),
        avatarUrl: clean(form.avatarUrl),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Profil güncellendi");
    } catch (err: any) {
      toast.error(err.message || "Profil güncellenemedi");
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCropSrc(await readFile(file));
      } catch (err) {
        console.error("Resim yüklenirken hata oluştu:", err);
        toast.error("Resim yüklenemedi");
      }
      // Aynı dosya tekrar seçilebilsin diye input sıfırlanır
      e.target.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Hero: kapak + kimlik + tamamlanma halkası ─────────────────── */}
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="relative h-36 bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-cyan/60 md:h-44">
          <svg
            className="pointer-events-none absolute -right-6 -top-10 opacity-20"
            width="240"
            height="240"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="0.4" />
          </svg>
          <span className="absolute left-6 top-5 font-label-mono text-xs uppercase tracking-[0.3em] text-white/80 md:left-10">
            Profilim
          </span>
        </div>

        <div className="px-4 pb-6 sm:px-6 md:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <label className="group relative -mt-14 shrink-0 cursor-pointer md:-mt-16">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Avatar
                name={form.name || user.name}
                url={form.avatarUrl}
                className="size-28 text-2xl ring-4 ring-surface-1 md:size-32"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5 text-white" />
                <span className="font-label-mono text-[10px] font-bold text-white">
                  DEĞİŞTİR
                </span>
              </div>
            </label>

            <div className="pt-2 sm:pt-4">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-primary md:text-4xl">
                {form.name || user.name}
              </h2>
              <p className="mt-1 font-sans text-base text-on-surface-variant">
                {form.title || "Ünvan eklenmemiş"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Düzenleme alanları ────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Kişisel bilgiler */}
          <section className="glass-panel rounded-xl p-5 md:p-8">
            <div className="flex items-center gap-2">
              <IdCard className="size-5 text-accent-cyan" />
              <h3 className="font-serif text-2xl font-bold text-primary">
                Kişisel Bilgiler
              </h3>
            </div>
            <p className="mt-1 font-mono text-xs italic text-on-surface-variant/60">
              Sizi tanımlayan temel bilgiler
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="p-name" className={labelClasses}>
                  Ad Soyad
                </label>
                <input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={fieldClasses}
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="p-phone" className={labelClasses}>
                  Telefon
                </label>
                <input
                  id="p-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={fieldClasses}
                  placeholder="05xx xxx xx xx"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="p-location" className={labelClasses}>
                  Konum
                </label>
                <input
                  id="p-location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={fieldClasses}
                  placeholder="Şehir / ofis"
                />
              </div>
            </div>
          </section>



          {/* Acil durum iletişimi */}
          <section className="glass-panel rounded-xl p-5 md:p-8">
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-accent-cyan" />
              <h3 className="font-serif text-2xl font-bold text-primary">
                Acil Durum İletişimi
              </h3>
            </div>
            <p className="mt-1 font-mono text-xs italic text-on-surface-variant/60">
              Acil bir durumda ulaşılacak kişi
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="e-name" className={labelClasses}>
                  Ad Soyad
                </label>
                <input
                  id="e-name"
                  value={form.emergencyName}
                  onChange={(e) => set("emergencyName", e.target.value)}
                  className={fieldClasses}
                  placeholder="Kişinin adı"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="e-relation" className={labelClasses}>
                  Yakınlık
                </label>
                <input
                  id="e-relation"
                  value={form.emergencyRelation}
                  onChange={(e) => set("emergencyRelation", e.target.value)}
                  className={fieldClasses}
                  placeholder="Örn. Eş, kardeş"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="e-phone" className={labelClasses}>
                  Telefon
                </label>
                <input
                  id="e-phone"
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => set("emergencyPhone", e.target.value)}
                  className={fieldClasses}
                  placeholder="05xx xxx xx xx"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sağ kolon */}
        <div className="flex h-full flex-col gap-6">


          {/* Hesap */}
          <section className="glass-panel rounded-xl p-5 md:p-8">
            <h3 className="font-serif text-2xl font-bold text-primary">Hesap</h3>
            <p className="mt-1 font-mono text-xs italic text-on-surface-variant/60">
              Bu bilgiler değiştirilemez
            </p>

            <ul className="mt-6 space-y-3">
              {/* E-posta */}
              <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                <span className="flex items-center gap-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                  <AtSign className="size-4" />
                  E-posta
                </span>
                <span className="truncate font-sans text-sm text-on-surface">
                  {user.email}
                </span>
              </li>

              {/* Departman (Rolün üstünde) */}
              {me?.department && (
                <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                  <span className="flex items-center gap-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                    <Briefcase className="size-3.5" />
                    Departman
                  </span>
                  <span className="font-sans text-sm text-on-surface">
                    {me.department}
                  </span>
                </li>
              )}

              {/* Rol (Departmanın altında - unvan / rol adı gösterir) */}
              <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                <span className="flex items-center gap-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                  <RoleIcon className="size-3.5" />
                  Rol
                </span>
                <span className="font-sans text-sm text-on-surface">
                  {user.title || me?.title || (user.role === "manager" ? "Departman Müdürü" : currentRoleInfo.label)}
                </span>
              </li>

              {(user.birthDate || form.birthDate) && (
                <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                  <span className="flex items-center gap-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
                    <Cake className="size-4" />
                    Doğum Günü
                  </span>
                  <span className="font-sans text-sm text-on-surface">
                    {(() => {
                      const raw = user.birthDate || form.birthDate || "";
                      const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
                      return !isNaN(d.getTime())
                        ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
                        : raw;
                    })()}
                  </span>
                </li>
              )}
            </ul>
          </section>
          <section className="glass-panel mt-auto rounded-xl p-5 md:p-8">
            <h3 className="mb-4 font-serif text-xl font-bold text-primary">
              Değişiklikleri Kaydet
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-sans text-sm text-on-surface-variant">
                {dirty ? (
                  <span className="text-primary font-medium">Kaydedilmemiş değişiklikler var</span>
                ) : saved ? (
                  <span className="inline-flex items-center gap-1.5 text-accent-cyan font-medium">
                    <Check className="size-4" />
                    Değişiklikler kaydedildi
                  </span>
                ) : (
                  "Tüm bilgileriniz güncel"
                )}
              </p>
              <div className="flex items-center gap-3">
                {dirty && (
                  <button
                    type="button"
                    onClick={() => setForm(formFromUser(user))}
                    className="cursor-pointer font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
                  >
                    Vazgeç
                  </button>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!dirty}
                  className="bg-accent-cyan px-6 text-white hover:bg-accent-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onComplete={(cropped) => {
            set("avatarUrl", cropped);
            setCropSrc(null);
          }}
        />
      )}
    </form>
  );
}
