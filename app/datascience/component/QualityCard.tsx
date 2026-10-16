import React from "react";
import { Quality } from "./types";

interface QualityListProps {
  title: string;
  items: string[];
  tone: "amber" | "red" | "emerald";
  empty: string;
}

export function QualityList({ title, items, tone, empty }: QualityListProps) {
  const toneCls = {
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {title}
      </div>
      {items.length === 0 ? (
        <span className="text-slate-400">{empty}</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((c) => (
            <span key={c} className={`px-1.5 py-0.5 rounded ${toneCls} font-medium`}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface QualityCardProps {
  quality: Quality;
}

export function QualityCard({ quality }: QualityCardProps) {
  const scoreColor =
    quality.score >= 80 ? "#10b981" : quality.score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className="flex flex-col items-center justify-center w-24 h-24 rounded-full flex-shrink-0"
          style={{
            background: `conic-gradient(${scoreColor} ${quality.score * 3.6}deg, #e2e8f0 0deg)`,
          }}
        >
          <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{quality.score}</span>
            <span className="text-[9px] text-slate-400 uppercase">Qualidade</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <QualityList
            title="Colunas constantes"
            items={quality.constant_columns}
            tone="amber"
            empty="Nenhuma"
          />
          <QualityList
            title="Muitos nulos (≥50%)"
            items={quality.high_null_columns}
            tone="red"
            empty="Nenhuma"
          />
          <QualityList
            title="Chaves candidatas"
            items={quality.potential_keys}
            tone="emerald"
            empty="—"
          />
        </div>
      </div>
    </section>
  );
}
