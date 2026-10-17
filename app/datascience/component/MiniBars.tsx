import React from "react";

interface MiniBarsProps {
  values: number[];
  labels?: string[];
  color?: string;
}

export function MiniBars({ values, labels, color = "#6366f1" }: MiniBarsProps) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              backgroundColor: color,
              minHeight: v > 0 ? 2 : 0,
            }}
          />
          {labels && (
            <span className="absolute -bottom-4 text-[8px] text-slate-400 truncate max-w-full">
              {labels[i]}
            </span>
          )}
          <span className="absolute -top-4 text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100">
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
