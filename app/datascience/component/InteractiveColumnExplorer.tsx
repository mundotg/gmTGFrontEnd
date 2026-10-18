import React, { useState, useMemo } from "react";
import {
  ColumnStat,
  fmt,
} from "./types";
import {
  Search,
  Filter,
  Hash,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { MiniBars } from "./MiniBars";
import { StudyCallout } from "./StudyCallout";

interface InteractiveColumnExplorerProps {
  columns: ColumnStat[];
  studyMode: boolean;
  onSelectColumn: (col: ColumnStat) => void;
  onOpenDictionaryTerm: (termId: string) => void;
}

export function InteractiveColumnExplorer({
  columns,
  studyMode,
  onSelectColumn,
  onOpenDictionaryTerm,
}: InteractiveColumnExplorerProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("original");

  // Filtering & Sorting
  const filteredColumns = useMemo(() => {
    let list = columns.filter((col) => {
      const q = search.toLowerCase();
      const matchSearch = !q || col.name.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (kindFilter === "all") return true;
      if (kindFilter === "numeric") return col.kind === "numeric";
      if (kindFilter === "categorical") return col.kind === "categorical";
      if (kindFilter === "datetime") return col.kind === "datetime";
      if (kindFilter === "boolean") return col.kind === "boolean";
      if (kindFilter === "has_nulls") return col.nulls > 0;
      if (kindFilter === "has_outliers")
        return (col.numeric?.outliers?.count ?? 0) > 0;
      return true;
    });

    if (sortBy === "nulls_desc") {
      list = [...list].sort((a, b) => b.null_pct - a.null_pct);
    } else if (sortBy === "outliers_desc") {
      list = [...list].sort(
        (a, b) =>
          (b.numeric?.outliers?.count ?? 0) - (a.numeric?.outliers?.count ?? 0)
      );
    } else if (sortBy === "distinct_desc") {
      list = [...list].sort((a, b) => b.distinct - a.distinct);
    } else if (sortBy === "name_asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [columns, search, kindFilter, sortBy]);

  const numericCount = columns.filter((c) => c.kind === "numeric").length;
  const catCount = columns.filter((c) => c.kind === "categorical").length;
  const dateCount = columns.filter((c) => c.kind === "datetime").length;
  const boolCount = columns.filter((c) => c.kind === "boolean").length;
  const nullsCount = columns.filter((c) => c.nulls > 0).length;
  const outliersCount = columns.filter(
    (c) => (c.numeric?.outliers?.count ?? 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      {studyMode && (
        <StudyCallout
          badge="Guia de Estatística Descritiva"
          title="Para que serve analisar cada coluna isoladamente?"
          concept="A análise univariada (coluna a coluna) examina a distribuição, o centro (média/mediana), a dispersão (desvio padrão) e a pureza (nulos/outliers) de cada variável antes de combiná-las em gráficos complexos ou modelos."
          whyItMatters="Permite detectar anomalias locais: se uma coluna de preços tiver valores negativos, se uma coluna de idade tiver média 120 anos, ou se uma coluna de status só tiver 1 único valor em toda a tabela."
          practicalTip="Clique em qualquer cartão de coluna abaixo para abrir o 'Raio-X Detalhado', com histograma ampliado, explicação narrativa em português e diagnóstico completo."
        />
      )}

      {/* Control Bar: Search + Filters + Sort */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar coluna pelo nome..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="original">Ordem Original</option>
              <option value="nulls_desc">Mais Nulos Primeiro</option>
              <option value="outliers_desc">Mais Outliers Primeiro</option>
              <option value="distinct_desc">Maior Cardinalidade</option>
              <option value="name_asc">Nome Alfabético (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "all", label: `Todas (${columns.length})` },
            { id: "numeric", label: `Numéricas (# ${numericCount})` },
            { id: "categorical", label: `Texto / Categóricas (Aa ${catCount})` },
            { id: "datetime", label: `Temporal (${dateCount})` },
            { id: "boolean", label: `Booleana (${boolCount})` },
            { id: "has_nulls", label: `Com Nulos (⚠️ ${nullsCount})` },
            { id: "has_outliers", label: `Com Outliers (🚨 ${outliersCount})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setKindFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                kindFilter === pill.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredColumns.map((col) => {
          const isNum = col.kind === "numeric" && col.numeric;
          const isCat = col.kind === "categorical" && col.categorical;
          const isDate = col.kind === "datetime" && col.datetime;
          const isBool = col.kind === "boolean" && col.boolean;

          const kindColor = {
            numeric: "text-blue-600 bg-blue-50 border-blue-200",
            categorical: "text-purple-600 bg-purple-50 border-purple-200",
            datetime: "text-amber-600 bg-amber-50 border-amber-200",
            boolean: "text-emerald-600 bg-emerald-50 border-emerald-200",
          }[col.kind];

          return (
            <div
              key={col.name}
              onClick={() => onSelectColumn(col)}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${kindColor}`}
                      >
                        {col.is_primary_key
                          ? "🔑 PK"
                          : col.is_foreign_key
                          ? `🔗 FK${col.referenced_table ? ` → ${col.referenced_table}` : ""}`
                          : col.is_identifier
                          ? "🔑 ID Técnico"
                          : col.kind === "numeric"
                          ? "Numérica"
                          : col.kind === "categorical"
                          ? "Categórica"
                          : col.kind === "datetime"
                          ? "Data/Hora"
                          : "Booleana"}
                      </span>
                      {col.tipo_db && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {col.tipo_db}
                        </span>
                      )}
                      {col.is_critical && !col.is_identifier && !col.is_primary_key && !col.is_foreign_key && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          ⭐ Crítico
                        </span>
                      )}
                      {col.null_pct > 25 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          {col.null_pct}% Nulos
                        </span>
                      )}
                      {(col.numeric?.outliers?.count ?? 0) > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {col.numeric?.outliers?.count} outliers
                        </span>
                      )}
                    </div>

                    <h3
                      className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      title={col.name}
                    >
                      {col.name}
                    </h3>
                  </div>

                  <span className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 flex items-center justify-center shrink-0 transition-colors">
                    <ExternalLink size={14} />
                  </span>
                </div>

                {/* Preenchimento Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      Preenchidos: <b>{fmt(col.count)}</b>
                    </span>
                    <span>
                      Nulos: <b>{col.null_pct}%</b>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${100 - col.null_pct}%` }}
                    />
                    <div
                      className="bg-red-400 h-full"
                      style={{ width: `${col.null_pct}%` }}
                    />
                  </div>
                </div>

                {/* Numeric View */}
                {isNum && col.numeric && (
                  <div className="space-y-3">
                    <MiniBars values={col.numeric.histogram.counts} />

                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Média
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {fmt(col.numeric.mean)}
                        </span>
                      </div>
                      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl p-2 text-center border border-indigo-100 dark:border-indigo-900">
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold block">
                          Mediana
                        </span>
                        <span className="font-bold text-indigo-900 dark:text-indigo-200">
                          {fmt(col.numeric.median)}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          P95
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {fmt(col.numeric.p95)}
                        </span>
                      </div>
                    </div>

                    {/* Extremos: Menor e Maior Número */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-2">
                        <span className="text-blue-700 dark:text-blue-300 font-bold block">
                          🔻 Menor: {fmt(col.numeric.min)}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Linha #{col.numeric.min_index ?? "—"}
                        </span>
                      </div>
                      <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-xl p-2">
                        <span className="text-purple-700 dark:text-purple-300 font-bold block">
                          🔺 Maior: {fmt(col.numeric.max)}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Linha #{col.numeric.max_index ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Categorical View */}
                {isCat && col.categorical && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-500">
                      Top Categorias ({col.distinct} distintas):
                    </div>
                    {col.categorical.top.slice(0, 3).map((t, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-200">
                            {t.value || "<vazio>"}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {t.pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Datetime View */}
                {isDate && col.datetime && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-2xl p-2.5">
                      <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-bold">
                        <span>📅 Menor Data (Início):</span>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                          Linha #{col.datetime.min_index ?? "—"}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 mt-0.5 font-semibold">
                        {new Date(col.datetime.min).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-2.5">
                      <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300 font-bold">
                        <span>📅 Maior Data (Fim):</span>
                        <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded">
                          Linha #{col.datetime.max_index ?? "—"}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 mt-0.5 font-semibold">
                        {new Date(col.datetime.max).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Boolean View */}
                {isBool && col.boolean && (
                  <div className="space-y-2">
                    <MiniBars
                      values={[col.boolean.true, col.boolean.false]}
                      labels={["Sim", "Não"]}
                      color="#10b981"
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                Explorar Raio-X & Análise
              </button>
            </div>
          );
        })}
      </div>

      {filteredColumns.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm">
          Nenhuma coluna corresponde aos filtros selecionados.
        </div>
      )}
    </div>
  );
}
