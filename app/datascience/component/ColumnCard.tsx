import React from "react";
import { Hash, Type as TypeIcon, Calendar, ToggleLeft } from "lucide-react";
import { ColumnStat, fmt } from "./types";
import { MiniBars } from "./MiniBars";

const KIND_META: Record<
  ColumnStat["kind"],
  { icon: React.ElementType; color: string; label: string }
> = {
  numeric: { icon: Hash, color: "text-blue-600 bg-blue-50", label: "Numérica" },
  categorical: { icon: TypeIcon, color: "text-purple-600 bg-purple-50", label: "Categórica" },
  datetime: { icon: Calendar, color: "text-amber-600 bg-amber-50", label: "Data/Hora" },
  boolean: { icon: ToggleLeft, color: "text-emerald-600 bg-emerald-50", label: "Booleana" },
};

export const Kv = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="bg-slate-50 rounded px-1.5 py-1">
    <span className="text-slate-400">{k}</span>{" "}
    <span className="font-semibold text-slate-700">{v}</span>
  </div>
);

interface ColumnCardProps {
  col: ColumnStat;
}

export function ColumnCard({ col }: ColumnCardProps) {
  const meta = KIND_META[col.kind] ?? KIND_META.categorical;
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-800 text-sm truncate" title={col.name}>
            {col.name}
          </div>
          <div className="text-[10px] text-slate-400">
            {meta.label} · {col.distinct} distinto(s)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="text-slate-500">
          Preenchidos: <span className="font-semibold text-slate-700">{col.count}</span>
        </div>
        <div className="text-slate-500">
          Nulos:{" "}
          <span
            className={`font-semibold ${
              col.null_pct > 30 ? "text-red-600" : "text-slate-700"
            }`}
          >
            {col.null_pct}%
          </span>
        </div>
      </div>

      {col.kind === "numeric" && col.numeric && (
        <>
          <div className="mb-4">
            <MiniBars values={col.numeric.histogram.counts} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <Kv k="mín" v={fmt(col.numeric.min)} />
            <Kv k="média" v={fmt(col.numeric.mean)} />
            <Kv k="máx" v={fmt(col.numeric.max)} />
            <Kv k="mediana" v={fmt(col.numeric.median)} />
            <Kv k="desvio" v={fmt(col.numeric.std)} />
            <Kv k="p95" v={fmt(col.numeric.p95)} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {!!col.numeric.outliers && col.numeric.outliers.count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium border border-red-100">
                {col.numeric.outliers.count} outliers ({col.numeric.outliers.pct}%)
              </span>
            )}
            {col.numeric.skew != null && Math.abs(col.numeric.skew) >= 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100">
                assimétrica {col.numeric.skew > 0 ? "↗" : "↙"} ({col.numeric.skew.toFixed(1)})
              </span>
            )}
          </div>
        </>
      )}

      {col.kind === "categorical" && col.categorical && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {col.categorical.semantic && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                🏷 {col.categorical.semantic}
              </span>
            )}
            {(col.categorical.imbalance_pct ?? 0) >= 80 && col.distinct > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100">
                desequilibrada {col.categorical.imbalance_pct}%
              </span>
            )}
          </div>
          {col.categorical.top.slice(0, 6).map((t) => (
            <div key={t.value} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600 truncate w-24" title={t.value}>
                {t.value}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${t.pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">{t.pct}%</span>
            </div>
          ))}
          {col.categorical.is_text && (
            <div className="text-[10px] text-slate-400 mt-1 italic">
              Alta cardinalidade (texto)
            </div>
          )}
        </div>
      )}

      {col.kind === "datetime" && col.datetime && (
        <div className="text-[11px] space-y-1">
          <Kv k="início" v={new Date(col.datetime.min).toLocaleString()} />
          <Kv k="fim" v={new Date(col.datetime.max).toLocaleString()} />
        </div>
      )}

      {col.kind === "boolean" && col.boolean && (
        <MiniBars
          values={[col.boolean.true, col.boolean.false]}
          labels={["Sim", "Não"]}
          color="#10b981"
        />
      )}
    </div>
  );
}
