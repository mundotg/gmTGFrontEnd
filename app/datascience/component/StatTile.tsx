import React from "react";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
}

export function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
