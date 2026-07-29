"use client";

import React from "react";
import { Select } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
  required?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seçiniz...",
  disabled = false,
  className,
  id,
  ariaLabel,
  required,
}: CustomSelectProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Select.Root
      value={value}
      onValueChange={(val) => {
        if (val !== null && val !== undefined) {
          onChange(val);
        }
      }}
      disabled={disabled}
      required={required}
    >
      <Select.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2 text-base text-on-surface outline-none transition-colors hover:border-accent-cyan/40 focus:border-accent-cyan/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer data-[popup-open]:border-accent-cyan/50",
          className
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Select.Icon>
          <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform data-[popup-open]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} align="start" className="z-50 min-w-[var(--anchor-width)]">
          <Select.Popup className="glass-panel custom-scrollbar z-50 max-h-60 w-full overflow-y-auto rounded-xl p-1.5 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 font-sans text-sm text-on-surface outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10 data-[highlighted]:text-accent-cyan"
              >
                <Select.ItemText className="truncate">{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-4 shrink-0 text-accent-cyan" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
