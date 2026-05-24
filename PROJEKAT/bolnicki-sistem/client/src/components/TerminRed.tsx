import {
  Clock,
  AlertTriangle
} from "lucide-react";

import type { Termin } from "../types";

import {
  formatV,
  tipConfig,
  statusConfig
} from "../utils/rezervacijeUtils";

export function TerminRed({
  termin,
  onClick,
  selected
}: {
  termin: Termin;
  onClick: () => void;
  selected: boolean;
}) {
  const tc = tipConfig[termin.tip];
  const sc = statusConfig[termin.status];

  return (
  <div
    onClick={onClick}
    className={`
      group rounded-2xl p-4 cursor-pointer transition-all duration-200
      border bg-white
      ${selected
        ? "border-blue-400 ring-2 ring-blue-100 shadow-md"
        : "border-gray-200 hover:border-blue-200 hover:shadow-sm"
      }
    `}
  >
    <div className="flex items-center gap-4">
      <div className="min-w-[64px] rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-center">
        <div className="text-sm font-bold text-gray-900 tabular-nums">
          {formatV(termin.vrijemeOd)}
        </div>
        <div className="text-xs text-gray-400 tabular-nums">
          {formatV(termin.vrijemeDo)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-900 truncate">
            {termin.pacijent.ime} {termin.pacijent.prezime}
          </span>

          {termin.tip === "hitni" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full flex-shrink-0">
              <AlertTriangle size={10} /> HITNO
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tc.badge}`}>
            {tc.label}
          </span>

          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>
            {sc.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-shrink-0">
        <Clock size={12} />
        <span className="font-semibold tabular-nums">
          {tipConfig[termin.tip].trajanje} min
        </span>
      </div>
    </div>
  </div>
);
}