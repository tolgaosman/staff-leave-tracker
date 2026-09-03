import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale/tr";
import "react-datepicker/dist/react-datepicker.css";

// Configure Turkish locale for the date picker
registerLocale("tr", tr);

interface CustomDatePickerProps {
  selected?: Date | null;
  onChange: (date: any) => void;
  minDate?: Date;
  placeholderText?: string;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  showTimeSelect?: boolean;
  dateFormat?: string;
  selectsRange?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

export function CustomDatePicker({
  selected,
  onChange,
  minDate,
  placeholderText = "Gün/Ay/Yıl",
  className,
  wrapperClassName = "w-full",
  required,
  showTimeSelect = false,
  dateFormat = "dd.MM.yyyy",
  selectsRange,
  startDate,
  endDate,
}: CustomDatePickerProps) {
  const safeSelected = isValidDate(selected) ? selected : null;
  const safeMinDate = isValidDate(minDate) ? minDate : undefined;
  const safeStartDate = isValidDate(startDate) ? startDate : null;
  const safeEndDate = isValidDate(endDate) ? endDate : null;

  const commonProps = {
    locale: "tr",
    dateFormat: showTimeSelect ? "dd.MM.yyyy HH:mm" : dateFormat,
    showTimeSelect,
    timeFormat: "HH:mm",
    timeIntervals: 15,
    minDate: safeMinDate,
    placeholderText,
    wrapperClassName,
    className:
      className ||
      "w-full rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-accent-cyan/50 placeholder-on-surface-variant/40",
    required,
    isClearable: true,
  } as const;

  if (selectsRange) {
    return (
      <DatePicker
        {...commonProps}
        selectsRange
        startDate={safeStartDate}
        endDate={safeEndDate}
        onChange={onChange}
      />
    );
  }

  return (
    <DatePicker
      {...commonProps}
      selected={safeSelected}
      onChange={onChange}
    />
  );
}
