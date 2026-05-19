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
    <div onClick={onClick} className={`${tc.row} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${selected ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[52px]">
          <div className="text-sm font-bold text-gray-900">{formatV(termin.vrijemeOd)}</div>
          <div className="text-xs text-gray-400">{formatV(termin.vrijemeDo)}</div>
        </div>
        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{termin.pacijent.ime} {termin.pacijent.prezime}</span>
            {termin.tip === "hitni" && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                <AlertTriangle size={10} /> HITNO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.badge}`}>{tc.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
          <Clock size={11} />{tipConfig[termin.tip].trajanje} min
        </div>
      </div>
    </div>
  );
}