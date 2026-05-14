"use client";

import { useState } from "react";

import { formatNepaliCurrency } from "@pt/shared";

export function MoneyInput({
  name,
  defaultValue,
  required,
  placeholder,
}: {
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
}) {
  const [val, setVal] = useState<string>(
    defaultValue === null || defaultValue === undefined ? "" : String(defaultValue),
  );

  const isValid = val === "" || /^\d+(\.\d+)?$/.test(val);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        inputMode="decimal"
        name={name}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        required={required}
        placeholder={placeholder ?? "0"}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
      />
      {val && isValid && (
        <span className="text-xs text-white/40">{formatNepaliCurrency(val)}</span>
      )}
      {val && !isValid && (
        <span className="text-xs text-red-300">Enter a number (no commas).</span>
      )}
    </div>
  );
}
