"use client";

import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  Check,
  ChevronDown,
  ShieldCheck,
  User,
  Users,
  Briefcase,
  Laptop,
  Calculator,
  Megaphone,
  Palette,
  Truck,
  Headphones,
  Building2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRoleStore, useRole, type RoleOption } from "@/components/auth/role-store";
import { apiFetch } from "@/lib/api";

const popupClasses =
  "glass-panel z-50 rounded-xl p-2 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const itemClasses =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-base text-on-surface outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-accent-cyan";

function getDepartmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("bilgi") || lower.includes("it") || lower.includes("yazılım") || lower.includes("teknoloji") || lower.includes("sistem")) {
    return Laptop;
  }
  if (lower.includes("insan") || lower.includes("ik") || lower.includes("personel") || lower.includes("hr")) {
    return Users;
  }
  if (lower.includes("muhasebe") || lower.includes("finans") || lower.includes("mali")) {
    return Calculator;
  }
  if (lower.includes("pazarlama") || lower.includes("satış") || lower.includes("reklam") || lower.includes("marketing")) {
    return Megaphone;
  }
  if (lower.includes("tasarım") || lower.includes("dizayn") || lower.includes("grafik")) {
    return Palette;
  }
  if (lower.includes("lojistik") || lower.includes("operasyon") || lower.includes("depo")) {
    return Truck;
  }
  if (lower.includes("destek") || lower.includes("müşteri") || lower.includes("çağrı")) {
    return Headphones;
  }
  return Building2;
}

const staticOptions = [
  { value: "super_admin", label: "Admin", icon: ShieldCheck },
];

export function RoleSwitcher() {
  const { user } = useAuth();
  const role = useRole();
  const { setSimulatedRole, simulatedRole } = useRoleStore();
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      apiFetch<any[]>("/departments")
        .then(setDepartments)
        .catch(() => {});
    }
  }, [user?.role]);

  let options: any[] = [];
  
  if (user?.role === "super_admin") {
    const dynamicOptions = departments.map(d => ({
      value: `manager:${d.id}`,
      label: `Müdür (${d.name})`,
      icon: getDepartmentIcon(d.name)
    }));
    options = [staticOptions[0], ...dynamicOptions];
  }

  /* Görünüm değiştirebilecek rolü olmayan kullanıcıya (ör. düz çalışan)
     hiç gösterme. mobile-nav bu bileşeni koşulsuz render ettiği için, aksi
     halde aşağıdaki fallback boş listeyi staticOptions[0]'a düşürüp çalışana
     yanlışlıkla "Admin" etiketli, hiç seçeneği olmayan bir menü gösteriyordu. */
  if (options.length === 0) return null;

  // Güvenlik: active değeri bulunamazsa ilk seçeneğe düş
  const active = options.find((o) => o.value === role) ?? options[0];
  const ActiveIcon = active.icon;

  /* "(Simüle)" etiketi yalnızca GERÇEK simülasyonda gösterilir: super_admin'in
     başka bir departman müdürü rolünü taklit etmesi. Müdür kullanıcı için
     simulatedRole yalnızca "Kişisel Görünüm" ↔ "Departman Müdürü" arasında
     geçiş yapan meşru bir görünüm anahtarıdır, simülasyon değil. */
  const isSimulating = user?.role === "super_admin" && Boolean(simulatedRole);

  const handleSelect = (val: RoleOption) => {
    if (val === "super_admin") {
      setSimulatedRole(null);
    } else {
      setSimulatedRole(val);
    }
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Rol seç"
        className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-1 px-2.5 py-1 text-xs font-medium text-on-surface-variant outline-none transition-colors hover:text-primary data-[popup-open]:border-accent-cyan/40 data-[popup-open]:text-primary cursor-pointer sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
      >
        <ActiveIcon className="size-3.5 sm:size-4" />
        <span>{active.label}</span>
        <ChevronDown className="size-3 opacity-60 sm:size-3.5" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={12} align="end" className="z-50">
          <Menu.Popup className={`${popupClasses} w-56`}>
            <div className="px-3 pb-2 pt-1 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
              Görünüm Seçimi
            </div>
            {options.map((o) => {
              const Icon = o.icon;
              return (
                <Menu.Item
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className={itemClasses}
                >
                  <Icon className="size-4 opacity-70" />
                  <span className="flex-1">{o.label}</span>
                  {role === o.value && (
                    <Check className="size-4 text-accent-cyan" />
                  )}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
