"use client";

import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, ShieldCheck, User, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRoleStore, useRole, type RoleOption } from "@/components/auth/role-store";
import { apiFetch } from "@/lib/api";

const popupClasses =
  "glass-panel z-50 rounded-xl p-2 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const itemClasses =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-base text-on-surface outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-accent-cyan";

const staticOptions = [
  { value: "super_admin", label: "Super Admin", icon: ShieldCheck },
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
      icon: Briefcase
    }));
    options = [staticOptions[0], ...dynamicOptions, { value: "employee", label: "Çalışan", icon: User }];
  } else if (user?.role === "manager") {
    options = [
      { value: "employee", label: "Kişisel Görünüm", icon: User },
      { value: "manager", label: "Departman Müdürü", icon: Briefcase }
    ];
  }

  // Güvenlik: active değeri bulunamazsa ilk seçeneğe düş
  const active = options.find((o) => o.value === role) ?? options[0] ?? staticOptions[0];
  const ActiveIcon = active.icon;

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
        <span>{active.label} {user?.role === "super_admin" && "(Simüle)"}</span>
        <ChevronDown className="size-3 opacity-60 sm:size-3.5" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={12} align="end" className="z-50">
          <Menu.Popup className={`${popupClasses} w-56`}>
            <div className="px-3 pb-2 pt-1 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant/70">
              {user?.role === "super_admin" ? "Görünüm rolü simülasyonu" : "Görünüm Seçimi"}
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
