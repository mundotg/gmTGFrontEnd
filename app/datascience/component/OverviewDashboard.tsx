import React, { useState } from "react";
import {
  Overview,
  Quality,
  ColumnStat,
  fmt,
} from "./types";
import {
  Database,
  Columns,
  Hash,
  AlertTriangle,
  Copy,
  Cpu,
  ShieldCheck,
  Sparkles,
  Lightbulb,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Calculator,
  Sliders,
  Key,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StudyCallout } from "./StudyCallout";

interface OverviewDashboardProps {
  overview: Overview;
  quality: Quality | null;
  insights: string[];
  columns: ColumnStat[];
  studyMode: boolean;
  onOpenDictionaryTerm: (termId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export function OverviewDashboard({
  overview,
  quality,
  insights,
  columns,
  studyMode,
  onOpenDictionaryTerm,
  onNavigateTab,
}: OverviewDashboardProps) {
  const numericCount = columns.filter((c) => c.kind === "numeric").length;
  const categoricalCount = columns.filter((c) => c.kind === "categorical").length;
  const dateCount = columns.filter((c) => c.kind === "datetime").length;

  const score = quality?.score ?? 100;
  const scoreColor =
    score >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
    score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Educational Banner when Study Mode is ON */}
      {studyMode && (
        <StudyCallout
          badge="Guia de Boas-Vindas"
          title="Como interpretar e estudar esta base de dados?"
          concept="Esta tela resume as dimensões volumétricas e a saúde dos dados extraídos pela sua consulta. Em Ciência de Dados, o primeiro passo antes de criar gráficos ou inteligência artificial é a Análise Exploratória (EDA - Exploratory Data Analysis), que verifica se a base tem tamanho suficiente, campos nulos ou duplicações."
          whyItMatters="Modelos e relatórios alimentados com dados sujos ou desequilibrados geram conclusões falsas ('Garbage In, Garbage Out'). Compreender a volumetria permite dimensionar o poder estatístico da sua amostra."
          practicalTip="Verifique se a contagem de linhas é representativa, se há duplicações que precisam de remoção (DISTINCT) e examine o Score de Qualidade para saber se a base precisa de tratamento prévio."
        />
      )}

      {/* Primary KPI Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Linhas */}
        <div
          onClick={() => onOpenDictionaryTerm("qualidade-dados-score")}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
              Total Linhas
            </span>
            <Database size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {fmt(overview.n_rows)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Amostra analisada</p>
        </div>

        {/* Colunas */}
        <div
          onClick={() => onNavigateTab("columns")}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
              Colunas
            </span>
            <Columns size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.n_cols}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {numericCount} num / {categoricalCount} texto
          </p>
        </div>

        {/* Nulos */}
        <div
          onClick={() => onOpenDictionaryTerm("qualidade-dados-score")}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
              Campos Nulos
            </span>
            <AlertTriangle size={16} className={overview.null_pct > 20 ? "text-amber-500" : "text-slate-400"} />
          </div>
          <div className={`text-2xl font-extrabold ${overview.null_pct > 20 ? "text-amber-600" : "text-slate-900 dark:text-white"}`}>
            {overview.null_pct}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {fmt(overview.total_nulls)} células vazias
          </p>
        </div>

        {/* Duplicadas */}
        <div
          onClick={() => onOpenDictionaryTerm("qualidade-dados-score")}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
              Duplicadas
            </span>
            <Copy size={16} className={overview.n_duplicated > 0 ? "text-red-500" : "text-slate-400"} />
          </div>
          <div className={`text-2xl font-extrabold ${overview.n_duplicated > 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}>
            {overview.n_duplicated}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Linhas idênticas</p>
        </div>

        {/* Tipos */}
        <div
          onClick={() => onNavigateTab("columns")}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
              Numéricas
            </span>
            <Hash size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {numericCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Para estatística e ML</p>
        </div>

        {/* Memória */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Uso Memória
            </span>
            <Cpu size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.memory_kb} <span className="text-xs font-normal text-slate-500">KB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Consumo em RAM</p>
        </div>
      </section>

      {/* Data Health & Quality Card */}
      {quality && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Header & Gauge */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              {/* Radial Score Gauge */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center p-1.5 shadow-md flex-shrink-0"
                style={{
                  background: `conic-gradient(${
                    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"
                  } ${score * 3.6}deg, #e2e8f0 0deg)`,
                }}
              >
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                    {score}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreColor}`}>
                    {score >= 80 ? "Alta Confiabilidade" : score >= 50 ? "Atenção Necessária" : "Baixa Qualidade"}
                  </span>
                  <span className="text-xs text-slate-500">· Diagnóstico de Integridade & Governança</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Score de Qualidade dos Dados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                  {score >= 80
                    ? "Excelente! Os dados apresentam alta completude, baixa duplicação e integridade pronta para análises estatísticas e algoritmos preditivos."
                    : score >= 50
                    ? "Esta base possui pontos de atenção em completude ou redundância. Recomenda-se tratamento antes de alimentar modelos de Machine Learning."
                    : "Atenção crítica: há muitas células em falta ou colunas sem variabilidade que comprometem os relatórios."}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenDictionaryTerm("qualidade-dados-score")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <BookOpen size={14} /> Como este score é calculado?
            </button>
          </div>

          {/* Requisito 7: Mostrar a fórmula, os pesos e as dimensões avaliadas */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calculator size={15} className="text-indigo-600 dark:text-indigo-400" />
                Fórmula de Avaliação Ponderada
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                4 Dimensões (DAMA-DMBOK)
              </span>
            </div>
            <div className="font-mono text-xs text-indigo-900 dark:text-indigo-200 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {quality.formula || "Score = 0.40 × Completude + 0.25 × Unicidade + 0.20 × Variabilidade + 0.15 × Identificabilidade"}
            </div>
          </div>

          {/* 4 Dimensões Avaliadas */}
          {quality.dimensions && quality.dimensions.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Sliders size={14} className="text-slate-400" />
                Dimensões Avaliadas e Pesos Aplicados:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {quality.dimensions.map((dim) => {
                  const dimStatusColor =
                    dim.status === "Excelente"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                      : dim.status === "Bom"
                      ? "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      : dim.status === "Atenção"
                      ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                      : "text-red-700 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-300";

                  return (
                    <div
                      key={dim.name}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {dim.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Peso: {dim.weight_pct}%
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {dim.score}
                            <span className="text-xs font-normal text-slate-400"> /100</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dimStatusColor}`}>
                            {dim.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full transition-all ${
                              dim.score >= 80 ? "bg-emerald-500" : dim.score >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {dim.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        {dim.metrics}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Requisito 1: Calcular completude por coluna e por campo crítico */}
          {quality.critical_fields && quality.critical_fields.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Completude de Campos Críticos de Negócio
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({quality.critical_fields.length} campos identificados)
                  </span>
                </div>
                {quality.critical_completeness_pct !== undefined && (
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Média Crítica: {quality.critical_completeness_pct}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {quality.critical_fields.map((cf) => {
                  const isFull = cf.completeness_pct >= 99.9;
                  const isOk = cf.completeness_pct >= 90;
                  return (
                    <div
                      key={cf.column}
                      className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={cf.column}>
                            {cf.column}
                          </span>
                          {cf.is_primary_key && (
                            <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              PK
                            </span>
                          )}
                          {cf.is_foreign_key && (
                            <span
                              className="text-[9px] font-bold px-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                              title={cf.referenced_table ? `Referencia ${cf.referenced_table}` : "Chave Estrangeira"}
                            >
                              FK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate" title={cf.reason || ""}>
                          {cf.reason || (cf.nulls > 0 ? `${cf.nulls} nulos` : "Sem nulos")}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isFull
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : isOk
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {cf.completeness_pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details breakdown (Chaves, Nulos e Constantes) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            {/* Chaves Candidatas */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <ShieldCheck size={16} className="text-emerald-500" />
                Chaves Primárias Candidatas
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Colunas com 100% de valores únicos e sem nulos (ideais para identificação única ou chaves estrangeiras).
              </p>
              {quality.potential_keys.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {quality.potential_keys.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[11px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">
                  Nenhuma chave única identificada (podem haver registros duplicados).
                </span>
              )}
            </div>

            {/* Muitos Nulos */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <AlertTriangle size={16} className="text-amber-500" />
                Colunas com Muitos Nulos (&ge; 50%)
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Mais da metade das linhas está em branco. Considere descartar ou usar imputação de dados.
              </p>
              {quality.high_null_columns.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {quality.high_null_columns.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold text-[11px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  ✓ Nenhuma coluna com excesso de nulos.
                </span>
              )}
            </div>

            {/* Colunas Constantes */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <AlertTriangle size={16} className="text-red-500" />
                Colunas com Valor Constante
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Possuem apenas 1 único valor em todas as linhas. Não acrescentam informação para estatística.
              </p>
              {quality.constant_columns.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {quality.constant_columns.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-semibold text-[11px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  ✓ Nenhuma coluna redundante (constante).
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Automatic Insights */}
      {insights.length > 0 && (
        <section className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 dark:from-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Lightbulb size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Descobertas & Insights Automáticos da Base
                </h3>
                <p className="text-xs text-slate-500">
                  Padrões, anomalias e relacionamentos relevantes identificados pelo algoritmo
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {insights.length} insight(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-amber-100 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5 shadow-sm"
              >
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{ins}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggested Study Flow (Trilha de Estudo dos Dados) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Trilha de Exploração & Aprendizagem
            </h3>
            <p className="text-xs text-slate-500">
              Passos recomendados para extrair conclusões com rigor científico
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => onNavigateTab("columns")}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
              Passo 1 · Distribuições
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
              Raio-X de Colunas
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Descubra médias, medianas, percentis (P95) e veja histogramas de cada campo.
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigateTab("correlations")}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
              Passo 2 · Causalidade
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
              Correlações Cruzadas
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Veja quais variáveis sobem ou descem juntas e teste hipóteses de causa e efeito.
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigateTab("segments")}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
              Passo 3 · Machine Learning
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
              Segmentação K-Means
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Descubra agrupamentos automáticos e personas escondidas nos seus registros.
            </p>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => onNavigateTab("anomalies")}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
              Passo 4 · Auditoria
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center justify-between">
              Detector de Anomalias
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Isole linhas discrepantes que podem representar fraudes, erros ou casos especiais.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
