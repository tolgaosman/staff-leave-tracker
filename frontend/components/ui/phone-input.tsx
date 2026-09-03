"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const COUNTRY_CODES = [
  { code: "+90", label: "TR (+90)" },
  { code: "+1", label: "US/CA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+33", label: "FR (+33)" },
];

export function PhoneInput({
  id,
  value,
  onChange,
  placeholder = "555 123 45 67",
  className,
  required,
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("+90");
  const [number, setNumber] = useState("");

  // Parse incoming value
  useEffect(() => {
    if (!value) {
      setNumber("");
      // Don't reset country code if they just cleared the input
      return;
    }

    // Try to find if it starts with any known country code
    let foundCode = null;
    let rest = value;

    if (value.startsWith("+")) {
      for (const cc of COUNTRY_CODES) {
        if (value.startsWith(cc.code)) {
          foundCode = cc.code;
          rest = value.slice(cc.code.length);
          break;
        }
      }
    }

    if (foundCode) {
      setCountryCode(foundCode);
      setNumber(rest.replace(/\D/g, ""));
    } else {
      // If no + country code, assume it's just a number and use the current country code
      // If it's a Turkish number starting with 0, strip the 0 for cleaner storage (optional, but good practice)
      // Actually, let's just strip non-digits.
      let cleaned = value.replace(/\D/g, "");
      if (countryCode === "+90" && cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      setNumber(cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (countryCode === "+90" && raw.startsWith("0")) {
        raw = raw.slice(1);
    }
    
    // We don't call setNumber here, we call onChange with the combined value.
    // The useEffect will parse it and setNumber.
    if (raw) {
      onChange(countryCode + raw);
    } else {
      onChange("");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    if (number) {
      onChange(newCode + number);
    }
  };

  return (
    <div className={cn("flex items-center w-full rounded-lg border border-border bg-surface-2/50 focus-within:border-accent-cyan/60 transition-colors", className)}>
      <select
        value={countryCode}
        onChange={handleCodeChange}
        className="h-full rounded-l-lg bg-transparent px-3 py-2.5 text-sm font-medium text-on-surface outline-none border-r border-border appearance-none focus:ring-2 focus:ring-accent-cyan cursor-pointer"
        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
      >
        {COUNTRY_CODES.map((cc) => (
          <option key={cc.code} value={cc.code}>
            {cc.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        className="flex-1 bg-transparent px-3 py-2.5 font-sans text-base text-on-surface outline-none placeholder-on-surface-variant/40"
      />
    </div>
  );
}
