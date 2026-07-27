import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Calendar,
  Building,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Yalnız admin görebilir; çalışan rolünde menüde ve rotada gizlenir. */
  adminOnly?: boolean;
};

export function isNavItemActive(pathname: string, href: string) {
  const normPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const normHref = href.endsWith("/") && href.length > 1 ? href.slice(0, -1) : href;
  return normHref === "/" ? normPath === "/" || normPath === "" : normPath.startsWith(normHref);
}

export const navItems: NavItem[] = [
  { label: "Genel Bakış", icon: LayoutDashboard, href: "/" },
  { label: "Personel Listesi", icon: Users, href: "/personnel", adminOnly: true },
  { label: "İzin Talepleri", icon: CalendarDays, href: "/leave-requests", adminOnly: true },
  { label: "İzin Takvimi", icon: Calendar, href: "/calendar", adminOnly: true },
];
