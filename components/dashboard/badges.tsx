import {
  leaveStatusLabels,
  personnelStatusLabels,
  type LeaveStatus,
  type PersonnelStatus,
} from "@/lib/data/types";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold";

const leaveStatusStyles: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={cn(base, leaveStatusStyles[status])}>
      {leaveStatusLabels[status]}
    </span>
  );
}

const personnelStatusStyles: Record<PersonnelStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "on-leave": "bg-[#f9eced] text-[#7b1e2b] ring-1 ring-[#e8c5ca]",
  inactive: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  resigned: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export function PersonnelStatusBadge({ status }: { status: PersonnelStatus }) {
  return (
    <span className={cn(base, personnelStatusStyles[status])}>
      {personnelStatusLabels[status]}
    </span>
  );
}
