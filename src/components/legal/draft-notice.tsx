import { AlertTriangle } from "lucide-react";

export function DraftNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-200">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-100">
          Draft — pending UK legal review
        </p>
        <p className="text-amber-200/80 mt-1 leading-relaxed">
          This document is a working draft written by the BWN team. It is not
          legal advice and must be reviewed by a UK-qualified solicitor with
          gambling-sector experience before BWN is made available beyond its
          current private invite list.
        </p>
      </div>
    </div>
  );
}
