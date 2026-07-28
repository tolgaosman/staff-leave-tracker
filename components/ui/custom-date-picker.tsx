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
  required?: boolean;
  showTimeSelect?: boolean;
  dateFormat?: string;
  selectsRange?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function CustomDatePicker({
  selected,
  onChange,
  minDate,
  placeholderText = "Gün/Ay/Yıl",
  className,
  required,
  showTimeSelect = false,
  dateFormat = "dd.MM.yyyy",
  selectsRange,
  startDate,
  endDate,
}: CustomDatePickerProps) {
  const commonProps = {
    locale: "tr",
    dateFormat: showTimeSelect ? "dd.MM.yyyy HH:mm" : dateFormat,
    showTimeSelect,
    timeFormat: "HH:mm",
    timeIntervals: 15,
    minDate,
    placeholderText,
    className:
      className ||
      "w-full rounded-lg border border-outline-variant/40 bg-surface-2 px-3 py-2 text-sm text-on-surface outline-none focus:border-accent-cyan",
    required,
    isClearable: true,
  } as const;

  // react-datepicker'ın tipleri selectsRange'in tam olarak `true`/`false` literal'ine
  // göre iki ayrı prop kümesini (aralık vs. tekil tarih) birbirini dışlayacak şekilde
  // ayırıyor; bu yüzden burada boolean bir prop yerine dallanarak render ediyoruz.
  if (selectsRange) {
    return (
      <DatePicker
        {...commonProps}
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={onChange}
      />
    );
  }

  return (
    <DatePicker
      {...commonProps}
      selected={selected}
      onChange={onChange}
    />
  );
}
