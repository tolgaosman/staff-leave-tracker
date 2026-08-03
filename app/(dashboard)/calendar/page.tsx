"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHasDashboardAccess, useRoleStore } from "@/components/auth/role-store";
import type { LeaveRequest, LeaveType, Personnel } from "@/lib/data/types";
import {
  CalendarDayDialog,
  type CalendarDayEntry,
} from "@/components/dashboard/calendar-day-dialog";

import { getPublicHolidayName } from "@/lib/date/holidays";
import { apiFetch } from "@/lib/api";

export default function CalendarPage() {
  const hasAccess = useHasDashboardAccess();
  const { simulatedRole } = useRoleStore();
  const router = useRouter();

  // Çalışan rolü bu sayfayı göremez → Genel Bakış'a yönlendir.
  useEffect(() => {
    if (!hasAccess) router.replace("/");
  }, [hasAccess, router]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<{
    iso: string;
    entries: CalendarDayEntry[];
  } | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>("/leave-requests"),
      apiFetch<any[]>("/personnel"),
    ])
      .then(([reqsData, persData]) => {
        setRequestsList(reqsData);
        const mappedPers: Personnel[] = persData.map((p) => ({
          id: String(p.id),
          name: p.name,
          department: p.department ? p.department.name : "Genel",
          departmentId: String(p.department_id),
          phone: p.phone || "-",
          status: p.status || "active",
          startDate: p.start_date || "",
          avatarUrl: p.user?.avatar_url || p.avatar_url || "",
          email: p.user?.email || "",
          role: p.user?.role || "employee",
        }));
        setPersonnelList(mappedPers);
      })
      .catch(() => {
        // quiet error
      });
  }, []);

  const personnelMap = useMemo(() => {
    const map = new Map<string, Personnel>();
    personnelList.forEach((p) => map.set(p.id, p));
    return map;
  }, [personnelList]);

  // Takvimde gösterilecek izinler: onaylı + bekleyen (reddedilenler hariç).
  const visibleLeaves = useMemo<LeaveRequest[]>(() => {
    return requestsList
      .filter((r) => {
        if (r.status !== "approved" && r.status !== "pending") return false;

        // Simüle edilen Manager rolü filtresi
        if (simulatedRole && simulatedRole.startsWith("manager:")) {
          const simulatedDeptId = simulatedRole.split(":")[1];
          const person = personnelMap.get(String(r.personnel_id));
          if (!person || person.departmentId !== simulatedDeptId) return false;
        }

        return true;
      })
      .map((item) => ({
        id: String(item.id),
        personnelId: String(item.personnel_id),
        type: (item.leave_type?.slug as LeaveType) || "annual",
        startDate: item.start_date ? item.start_date.slice(0, 10) : "",
        endDate: item.end_date ? item.end_date.slice(0, 10) : "",
        status: item.status || "pending",
        note: item.note || "",
        createdAt: item.created_at || "",
      }));
  }, [requestsList, personnelMap, simulatedRole]);

  const renderCells = () => {
    const cells = [];
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");

    // Boş günler
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[56px] rounded-lg border border-outline-variant/10 bg-surface-1/50 sm:min-h-[96px] sm:rounded-xl lg:min-h-[120px]"></div>);
    }

    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, "0");
      const currentIso = `${year}-${month}-${dayStr}`;

      const dateObj = new Date(year, currentDate.getMonth(), day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const holidayName = getPublicHolidayName(currentIso);

      // 1) Resmî Tatil veya Özel Gün (Hafta içi veya Hafta sonu) → Tatil adı gösterilir (İnsan adı yazılmaz)
      if (holidayName) {
        cells.push(
          <div
            key={day}
            className={`min-h-[56px] rounded-lg border p-1 text-left sm:min-h-[96px] sm:rounded-xl sm:p-2 lg:min-h-[120px] ${isWeekend
              ? "border-amber-500/25 bg-amber-500/5"
              : "border-amber-500/30 bg-amber-500/10"
              }`}
          >
            <div className="flex items-center justify-between font-mono text-xs font-bold text-black sm:text-sm">
              <span>{day}</span>
              <span className="inline-flex rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-black sm:hidden">
                Tatil
              </span>
            </div>
            <div className="mt-1.5">
              <div
                className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-1 font-sans text-xs font-bold text-black shadow-sm leading-tight text-balance"
                title={`Özel Gün / Resmî Tatil: ${holidayName}`}
              >
                🚩 {holidayName}
              </div>
            </div>
          </div>
        );
        continue;
      }

      // 2) Normal Hafta sonu (Cumartesi / Pazar) → İÇİ TAMAMEN BOŞ
      if (isWeekend) {
        cells.push(
          <div
            key={day}
            className="min-h-[56px] rounded-lg border border-outline-variant/15 bg-surface-2/40 p-1 text-left opacity-60 sm:min-h-[96px] sm:rounded-xl sm:p-2 lg:min-h-[120px]"
          >
            <div className="font-mono text-xs font-bold text-black sm:text-sm">
              <span>{day}</span>
            </div>
          </div>
        );
        continue;
      }

      // 3) Normal Hafta içi günü → O gün izinde olan personeller listelenir
      const entries: CalendarDayEntry[] = visibleLeaves
        .filter((r) => currentIso >= r.startDate && currentIso <= r.endDate)
        .map((leave) => {
          const person = personnelMap.get(leave.personnelId);
          return person ? { leave, person } : null;
        })
        .filter((e): e is CalendarDayEntry => e !== null)
        .sort((a, b) => (a.leave.status === b.leave.status ? 0 : a.leave.status === "approved" ? -1 : 1));

      const hasLeave = entries.length > 0;

      const cellContent = (
        <>
          <div className="flex items-center justify-between gap-1 font-mono text-xs font-bold text-primary sm:text-sm">
            <span>{day}</span>
            {hasLeave && (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-accent-cyan/15 text-[10px] font-bold text-accent-cyan sm:hidden">
                {entries.length}
              </span>
            )}
          </div>
          <div className="mt-2 hidden flex-col gap-1 sm:flex">
            {entries.map(({ leave, person }, idx) => (
              <div
                key={`${leave.id}-${idx}`}
                className={`truncate rounded px-2 py-1 text-xs font-semibold ${leave.status === "approved"
                  ? "bg-accent/50 text-accent-foreground shadow-sm"
                  : "border border-dashed border-accent-violet/50 bg-accent-violet/10 text-accent-violet"
                  }`}
                title={`${person.name} (${person.department}) — ${leave.status === "approved" ? "Onaylandı" : "Bekliyor"
                  }`}
              >
                {person.name.split(" ")[0]}
              </div>
            ))}
          </div>
        </>
      );

      const baseCell =
        "min-h-[56px] rounded-lg border p-1 text-left transition-colors sm:min-h-[96px] sm:rounded-xl sm:p-2 lg:min-h-[120px]";

      cells.push(
        hasLeave ? (
          <button
            key={day}
            type="button"
            onClick={() => setSelected({ iso: currentIso, entries })}
            aria-label={`${day} — ${entries.length} izinli personel, detayları gör`}
            className={`${baseCell} border-accent-cyan/40 bg-surface-1 cursor-pointer hover:border-accent-cyan hover:shadow-md active:scale-[0.99]`}
          >
            {cellContent}
          </button>
        ) : (
          <div
            key={day}
            className={`${baseCell} border-outline-variant/20 bg-surface-1`}
          >
            {cellContent}
          </div>
        )
      );
    }

    return cells;
  };

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  if (!hasAccess) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-stretch gap-4 border-b border-outline-variant/20 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
            İzin Takvimi
          </h2>
          <p className="font-sans text-base text-on-surface-variant mt-2">
            Personel izinlerinin aylık görünümü.
          </p>
          <div className="mt-3 flex items-center gap-4 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-accent/50" />
              Onaylı
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-dashed border-accent-violet/60 bg-accent-violet/10" />
              Bekleyen
            </span>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 rounded-full border border-outline-variant/30 bg-surface-1 px-3 py-2 shadow-sm sm:w-auto sm:justify-start sm:gap-4 sm:px-4">
          <button onClick={prevMonth} className="p-2 hover:bg-black/5 rounded-full cursor-pointer transition-colors text-on-surface-variant">
            <ChevronLeft className="size-5" />
          </button>
          <div className="w-32 text-center font-serif text-base font-bold text-primary sm:w-40 sm:text-lg">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-black/5 rounded-full cursor-pointer transition-colors text-on-surface-variant">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-3 sm:p-6">
        <div className="mb-2 grid grid-cols-7 gap-1 sm:mb-4 sm:gap-2 lg:gap-4">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, idx) => (
            <div key={day} className={`text-center text-[10px] font-bold sm:text-sm ${idx >= 5 ? "text-on-surface-variant/50" : "text-on-surface-variant"}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4">
          {renderCells()}
        </div>
      </div>

      <CalendarDayDialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        dateIso={selected?.iso ?? null}
        entries={selected?.entries ?? []}
      />
    </div>
  );
}
