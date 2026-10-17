import React from "react";
import { Trend, fmt } from "./types";

interface TrendChartProps {
  trend: Trend;
}

export function TrendChart({ trend }: TrendChartProps) {
  const pts = trend.series;
  const w = 600;
  const h = 120;
  const pad = 4;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const rng = max - min || 1;
  const xx = (i: number) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
  const yy = (v: number) => h - pad - ((v - min) / rng) * (h - pad * 2);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xx(i).toFixed(1)},${yy(p.v).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${xx(pts.length - 1)},${h - pad} L${xx(0)},${h - pad} Z`;
  const dirColor =
    trend.direction === "a subir"
      ? "#10b981"
      : trend.direction === "a descer"
      ? "#ef4444"
      : "#64748b";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          📈 Tendência de {trend.measure} ({trend.freq})
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: dirColor }}
          >
            {trend.direction} {trend.change_pct >= 0 ? "+" : ""}
            {trend.change_pct}%
          </span>
          <span className="text-[11px] text-slate-500">
            Previsão próx.: <b className="text-slate-800">{fmt(trend.forecast_next)}</b>
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
        <path d={area} fill={dirColor} opacity={0.1} />
        <path d={path} fill="none" stroke={dirColor} strokeWidth={2} />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{pts[0]?.t}</span>
        <span>{pts[pts.length - 1]?.t}</span>
      </div>
    </section>
  );
}
