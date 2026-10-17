import React from "react";
import { Sigma } from "lucide-react";
import { Corr } from "./types";

interface CorrHeatmapProps {
  corr: Corr;
}

export function CorrHeatmap({ corr }: CorrHeatmapProps) {
  if (!corr.columns.length) return null;

  const cell = (v: number | null) => {
    if (v == null) return "#f1f5f9";
    const a = Math.abs(v);
    return v >= 0 ? `rgba(37,99,235,${a})` : `rgba(220,38,38,${a})`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
        <Sigma size={16} className="text-indigo-600" /> Correlações
      </div>
      <table className="text-[10px]">
        <thead>
          <tr>
            <th></th>
            {corr.columns.map((c) => (
              <th
                key={c}
                className="px-1 py-1 text-slate-500 font-medium max-w-[60px] truncate"
                title={c}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corr.matrix.map((row, i) => (
            <tr key={i}>
              <td
                className="pr-2 text-slate-500 font-medium text-right max-w-[80px] truncate"
                title={corr.columns[i]}
              >
                {corr.columns[i]}
              </td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="w-8 h-8 text-center text-white font-semibold"
                  style={{ backgroundColor: cell(v) }}
                  title={`${v ?? "—"}`}
                >
                  {v == null ? "" : v.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
