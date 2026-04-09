"use client";

import { OddsFormat } from "@/types";
import { cn } from "@/lib/utils";

interface OddsToggleProps {
  format: OddsFormat;
  onChange: (format: OddsFormat) => void;
}

export function OddsToggle({ format, onChange }: OddsToggleProps) {
  return (
    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1">
      <button
        onClick={() => onChange("fractional")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
          format === "fractional"
            ? "bg-[#00FF87] text-black"
            : "text-zinc-400 hover:text-white"
        )}
      >
        Fractional
      </button>
      <button
        onClick={() => onChange("decimal")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
          format === "decimal"
            ? "bg-[#00FF87] text-black"
            : "text-zinc-400 hover:text-white"
        )}
      >
        Decimal
      </button>
    </div>
  );
}
