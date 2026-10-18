import React, { useState } from "react";
import { Trend, fmt } from "./types";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Target,
} from "lucide-react";
import { StudyCallout } from "./StudyCallout";

interface TrendStudioProps {
  trend: Trend | null;
  studyMode: boolean;
  onOpenDictionaryTerm: (termId: string) => void;
}

export function TrendStudio({
  trend,
  studyMode,
  onOpenDictionaryTerm,
}: TrendStudioProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    t: string;
    v: number;
    trend?: number | null;
    idx: number;
  } | null>(null);

  if (!trend || !trend.series || trend.series.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
        <Activity size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-medium">
          Nenhuma série temporal detectada nesta consulta.
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Para ver tendências e previsões futuras, a consulta precisa conter pelo menos uma coluna de data/hora (como created_at) associada a métricas numéricas contínuas.
        </p>
      </div>
    );
  }

  const pts = trend.series;
  const hasEnough = trend.has_enough_data !== false && pts.length >= 5;

  const w = 800;
  const h = 220;
  const pad = 28;
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

  // Linha de tendência ajustada por regressão linear
  const hasTrendLine = pts.some((p) => p.trend !== undefined && p.trend !== null);
  const trendPath = hasTrendLine
    ? pts
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${xx(i).toFixed(1)},${yy(p.trend ?? p.v).toFixed(1)}`
        )
        .join(" ")
    : null;

  const isUp = trend.direction === "a subir";
  const isDown = trend.direction === "a descer";
  const dirColor = isUp ? "#10b981" : isDown ? "#ef4444" : "#6366f1";

  const firstVal = pts[0]?.v ?? 0;
  const lastVal = pts[pts.length - 1]?.v ?? 0;

  return (
    <div className="space-y-6">
      {studyMode && (
        <StudyCallout
          badge="Guia de Séries Temporais & Previsões"
          title="O que é agregação temporal e por que usamos Intervalos de Confiança?"
          concept="Agrupar por períodos (como dia ou semana com created_at) consolida dados dispersos em ciclos regulares. Na extrapolação futura (previsão), uma estimativa pontual nunca é exata. Por isso, a estatística rigorosa exige intervalos de confiança (IC 95%), apresentando a margem de erro plausível."
          whyItMatters="Tomar decisões com previsões sem intervalo de confiança é arriscado. O intervalo de 95% indica a faixa onde o valor real tem 95% de probabilidade matemática de se situar no próximo período."
          practicalTip="Verifique a margem de erro: quanto mais dados históricos e menor a dispersão dos pontos, mais estreito e confiável é o intervalo de previsão."
        />
      )}

      {/* Requisito 3: Exigir dados temporais suficientes */}
      {!hasEnough && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 shadow-sm flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-amber-900 dark:text-amber-100 mb-1">
              Dados Temporais Insuficientes para Previsão Preditiva
            </div>
            <p className="leading-relaxed">
              {trend.reason ||
                `A série possui apenas ${pts.length} período(s) registrado(s). São necessários no mínimo 5 pontos temporais para ajustar uma regressão linear e calcular intervalos de confiança de 95% estatisticamente confiáveis.`}
            </p>
            <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              Abaixo exibimos os pontos históricos observados até o momento. À medida que mais dados forem gerados, as previsões e intervalos serão ativados automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Main Trend Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900 flex items-center gap-1">
                <Clock size={11} /> Agregação {trend.freq}
              </span>
              {trend.time_column && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Coluna: {trend.time_column}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {pts.length} pontos temporais
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Tendência de {trend.measure}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: dirColor }}
            >
              {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : null}
              {trend.direction.toUpperCase()} ({trend.change_pct >= 0 ? "+" : ""}
              {trend.change_pct}%)
            </span>

            {hasEnough && trend.forecast_next !== undefined && trend.forecast_next !== null && (
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5">
                <span className="text-slate-400">Previsão: </span>
                <b className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {fmt(trend.forecast_next)}
                </b>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Valor Inicial
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {fmt(firstVal)}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{pts[0]?.t}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Valor Mais Recente
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {fmt(lastVal)}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {pts[pts.length - 1]?.t}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Mínimo / Máximo
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {fmt(min)} / {fmt(max)}
            </div>
            <div className="text-[10px] text-slate-400">Intervalo observado</div>
          </div>

          {/* Requisito 3: Intervalos de Confiança na Previsão */}
          {hasEnough && trend.forecast_next !== undefined && trend.forecast_next !== null ? (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900 text-xs">
              <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>Previsão (IC 95%)</span>
                {trend.margin_of_error && (
                  <span className="text-[9px] font-normal text-indigo-700/70 dark:text-indigo-300">
                    ±{fmt(trend.margin_of_error)}
                  </span>
                )}
              </span>
              <div className="text-base font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">
                {fmt(trend.forecast_next)}
              </div>
              <div className="text-[10px] text-indigo-700/90 dark:text-indigo-300 font-semibold truncate">
                Faixa: [{fmt(trend.forecast_ci_lower)} a {fmt(trend.forecast_ci_upper)}]
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Previsão Futura
              </span>
              <div className="text-base font-bold text-slate-400 mt-0.5">
                Requer 5 períodos
              </div>
              <div className="text-[10px] text-slate-400">
                {pts.length}/5 observações
              </div>
            </div>
          )}
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-56 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dirColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={dirColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line
              x1={pad}
              y1={pad}
              x2={w - pad}
              y2={pad}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <line
              x1={pad}
              y1={h / 2}
              x2={w - pad}
              y2={h / 2}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <line
              x1={pad}
              y1={h - pad}
              x2={w - pad}
              y2={h - pad}
              stroke="#cbd5e1"
            />

            {/* Area & Line */}
            <path d={area} fill="url(#trendGradient)" />
            <path d={path} fill="none" stroke={dirColor} strokeWidth="3" />

            {/* Linha de Tendência Linear (Ajuste por Regressão) */}
            {trendPath && (
              <path
                d={trendPath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0.8"
              />
            )}

            {/* Interactive Points */}
            {pts.map((p, i) => {
              const cx = xx(i);
              const cy = yy(p.v);
              const isHovered = hoveredPoint?.idx === i;
              return (
                <g key={i} className="cursor-pointer">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? "#ffffff" : dirColor}
                    stroke={dirColor}
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint({ t: p.t, v: p.v, trend: p.trend, idx: i })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Active Hover Point Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in duration-150">
              Data: <b>{hoveredPoint.t}</b> · Observado: <b>{fmt(hoveredPoint.v)}</b>
              {hoveredPoint.trend !== undefined && hoveredPoint.trend !== null && (
                <span className="text-indigo-300 ml-1.5">· Ajuste Regressão: {fmt(hoveredPoint.trend)}</span>
              )}
            </div>
          )}

          {/* Bottom Time Range & Legend */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 font-semibold mt-2 px-2 gap-2">
            <span>Início: {pts[0]?.t}</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 rounded-full inline-block" style={{ backgroundColor: dirColor }} />
                Valores Observados
              </span>
              {trendPath && (
                <span className="flex items-center gap-1 text-indigo-500">
                  <span className="w-2.5 h-0.5 border-t-2 border-dashed border-indigo-500 inline-block" />
                  Tendência Linear
                </span>
              )}
            </div>
            <span>Fim: {pts[pts.length - 1]?.t}</span>
          </div>
        </div>

        {/* Narrative interpretation */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <b>Interpretação para Tomada de Decisão:</b>{" "}
            {hasEnough ? (
              isUp ? (
                <>
                  A métrica <b>{trend.measure}</b> apresenta ritmo de crescimento sustentado (+{trend.change_pct}%). O modelo preditivo projeta continuidade de alta com valor esperado de <b>{fmt(trend.forecast_next)}</b> no próximo intervalo, com intervalo de confiança de 95% entre <b>[{fmt(trend.forecast_ci_lower)} e {fmt(trend.forecast_ci_upper)}]</b> (margem de erro de ±{fmt(trend.margin_of_error)}). Recomenda-se dimensionar capacidade operacional para atender a demanda.
                </>
              ) : isDown ? (
                <>
                  A métrica <b>{trend.measure}</b> demonstra tendência de contração (-{Math.abs(trend.change_pct)}%). A previsão para o próximo período é de <b>{fmt(trend.forecast_next)}</b>, com margem de 95% de confiança de <b>[{fmt(trend.forecast_ci_lower)} a {fmt(trend.forecast_ci_upper)}]</b>. É aconselhável investigar as causas-raiz nas colunas correlacionadas.
                </>
              ) : (
                <>
                  A métrica <b>{trend.measure}</b> mantém-se estatisticamente estável ({trend.change_pct}%). A projeção com 95% de confiança oscila entre <b>[{fmt(trend.forecast_ci_lower)} e {fmt(trend.forecast_ci_upper)}]</b> com valor central estimado em <b>{fmt(trend.forecast_next)}</b>.
                </>
              )
            ) : (
              <>
                A série histórica da métrica <b>{trend.measure}</b> (agrupada por {trend.freq} através de '{trend.time_column || "data"}') ainda possui poucas observações ({pts.length} pontos). Para estimar projeções com intervalos de confiança confiáveis são necessários no mínimo 5 ciclos.
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
