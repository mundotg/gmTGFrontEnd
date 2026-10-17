import React from "react";
import { Segments, fmt } from "./types";

interface SegmentsViewProps {
  segments: Segments;
}

export function SegmentsView({ segments }: SegmentsViewProps) {
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-700 mb-3">
        👥 Segmentos / perfis — {segments.k} grupos
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.segments.map((s, i) => (
          <div key={s.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span
                className="w-6 h-6 rounded-md text-white text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: palette[i % palette.length] }}
              >
                {i + 1}
              </span>
              <span className="text-xs text-slate-500">
                {s.size} · {s.pct}%
              </span>
            </div>
            <div className="space-y-0.5">
              {Object.entries(s.center)
                .slice(0, 5)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-slate-500 truncate max-w-[90px]" title={k}>
                      {k.split(".").pop()}
                    </span>
                    <span className="font-semibold text-slate-700">{fmt(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
