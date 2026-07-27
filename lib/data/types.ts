/* Domain model for the leave-tracking app.
   Centralised here so pages/components share one source of truth. */

export type PersonnelStatus = "active" | "on-leave" | "inactive" | "resigned";


export type Personnel = {
  id: string;
  name: string;
  department: string;
  /** Backend department FK (as string). Set when data comes from the API;
      used to submit updates without re-resolving the department by name. */
  departmentId?: string;
  phone: string;
  status: PersonnelStatus;
  email?: string;
  /** Employment start date, ISO (yyyy-mm-dd). Also the seniority source
      used to derive each person's annual leave entitlement. */
  startDate?: string;
  avatarUrl?: string;
};

export type LeaveType = "annual" | "excuse" | "sick" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveRequest = {
  id: string;
  personnelId: string;
  type: LeaveType;
  /** ISO yyyy-mm-dd */
  startDate: string;
  /** ISO yyyy-mm-dd */
  endDate: string;
  status: LeaveStatus;
  rejectionReason?: string;
  note?: string;
  /** ISO timestamp of creation, used for activity/sorting */
  createdAt: string;
  /** ISO timestamp of the last approve/reject decision. Drives "fresh event"
      ordering in recent activity & notifications; unset while pending. */
  decidedAt?: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

/* ── Turkish display labels (single source for the UI) ── */

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Yıllık İzin",
  excuse: "Mazeret İzni",
  sick: "Hastalık İzni",
  unpaid: "Ücretsiz İzin",
};

/** Zorunlu belge isteyen izin türleri: form etiketi + tablo buton metni. */
export const attachmentConfig: Partial<
  Record<LeaveType, { label: string; buttonLabel: string }>
> = {
  sick: { label: "Doktor Raporu", buttonLabel: "Rapor" },
  excuse: { label: "Dilekçe", buttonLabel: "Dilekçe" },
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const personnelStatusLabels: Record<PersonnelStatus, string> = {
  active: "Aktif",
  "on-leave": "İzinde",
  inactive: "Pasif",
  resigned: "Ayrıldı",
};

import { workingDayCount } from "@/lib/date/business-days";

/** Whole working days between two ISO dates, inclusive of both ends.
    NOTE: counts business days only (excludes weekends and holidays). */
export function leaveDayCount(startDate: string, endDate: string): number {
  return workingDayCount(startDate, endDate);
}

/* ── Leave balance ─────────────────────────────────────────────────────
   A *derived* view object — it is never stored. It is recomputed on demand
   from a person + their approved annual leaves, so it can never drift out of
   sync with the underlying data (single source of truth). */
export type LeaveBalance = {
  personnelId: string;
  /** Yearly annual-leave entitlement, derived from seniority (startDate). */
  entitled: number;
  /** Working days already consumed by APPROVED annual leaves. */
  used: number;
  /** Working days locked up in PENDING annual requests (not yet deducted). */
  pending: number;
  /** entitled - used. Can be shown to the user as "kalan izin". */
  remaining: number;
};
