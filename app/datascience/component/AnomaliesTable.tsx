import React from "react";
import { Anomalies } from "./types";

interface AnomaliesTableProps {
  anomalies: Anomalies;
}

export function AnomaliesTable({ anomalies }: AnomaliesTableProps) {
  const cols = anomalies.rows[0] ? Object.keys(anomalies.rows[0].row).slice(0, 5) : [];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        🚨 Anomalias — {anomalies.count} linha(s) fora do normal
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="p-1.5">#</th>
            <th className="p-1.5">Score</th>
            {cols.map((c) => (
              <th key={c} className="p-1.5 truncate max-w-[120px]" title={c}>
                {c.split(".").pop()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {anomalies.rows.map((r) => (
            <tr key={r.index} className="border-t border-slate-100">
              <td className="p-1.5 text-slate-400">{r.index}</td>
              <td className="p-1.5">
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">
                  {r.score}
                </span>
              </td>
              {cols.map((c) => (
                <td key={c} className="p-1.5 text-slate-600 truncate max-w-[120px]">
                  {String(r.row[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
