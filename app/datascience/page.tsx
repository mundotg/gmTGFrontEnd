"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3, RefreshCcw, AlertCircle, Hash, Type as TypeIcon,
  Calendar, ToggleLeft, Sigma, Lightbulb, Loader2, Wifi, WifiOff,
} from "lucide-react";
import usePersistedState from "@/hook/localStoreUse";

// ── URL do WebSocket ──
const WS_BASE = ((process.env.NEXT_PUBLIC_BACKEND_URL ?? "")
  .replace(/^http/, "ws")
  .replace(/\/$/, "")) + "/datascience/ws";

// ── Tipos do resultado ──
type NumericStats = {
  min: number; max: number; mean: number; median: number; std: number;
  q25: number; q75: number; zeros: number; negatives: number;
  p90?: number; p95?: number; p99?: number; mode?: number | null; range?: number;
  cv?: number | null; skew?: number | null; kurtosis?: number | null;
  outliers?: { count: number; pct: number; lower: number; upper: number };
  histogram: { counts: number[]; edges: number[] };
};
type CatStats = {
  cardinality: number; is_text: boolean;
  mode?: string | null; imbalance_pct?: number; entropy?: number; semantic?: string | null;
  top: { value: string; count: number; pct: number }[];
};
type Quality = { score: number; constant_columns: string[]; high_null_columns: string[]; potential_keys: string[] };
type Trend = {
  measure: string; freq: string; direction: string; change_pct: number;
  forecast_next: number; series: { t: string; v: number }[];
};
type Anomalies = { count: number; rows: { index: number; score: number; row: Record<string, unknown> }[] };
type Segments = { k: number; columns: string[]; segments: { id: number; size: number; pct: number; center: Record<string, number> }[] };
type ColumnStat = {
  name: string; kind: "numeric" | "categorical" | "datetime" | "boolean";
  count: number; nulls: number; null_pct: number; distinct: number; distinct_pct: number;
  numeric?: NumericStats; categorical?: CatStats;
  datetime?: { min: string; max: string }; boolean?: { true: number; false: number };
};
type Overview = {
  n_rows: number; n_cols: number; n_duplicated: number;
  total_cells: number; total_nulls: number; null_pct: number; memory_kb: number;
};
type Corr = { columns: string[]; matrix: (number | null)[][] };

const fmt = (n: number | undefined | null) =>
  n == null ? "—" : Math.abs(n) >= 1000 ? n.toLocaleString() : (Number.isInteger(n) ? String(n) : n.toFixed(2));

// ══════════════════════════ Sub-componentes ══════════════════════════
function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBars({ values, labels, color = "#6366f1" }: { values: number[]; labels?: string[]; color?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: v > 0 ? 2 : 0 }}
          />
          {labels && (
            <span className="absolute -bottom-4 text-[8px] text-slate-400 truncate max-w-full">{labels[i]}</span>
          )}
          <span className="absolute -top-4 text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100">{v}</span>
        </div>
      ))}
    </div>
  );
}

const KIND_META: Record<ColumnStat["kind"], { icon: React.ElementType; color: string; label: string }> = {
  numeric: { icon: Hash, color: "text-blue-600 bg-blue-50", label: "Numérica" },
  categorical: { icon: TypeIcon, color: "text-purple-600 bg-purple-50", label: "Categórica" },
  datetime: { icon: Calendar, color: "text-amber-600 bg-amber-50", label: "Data/Hora" },
  boolean: { icon: ToggleLeft, color: "text-emerald-600 bg-emerald-50", label: "Booleana" },
};

function ColumnCard({ col }: { col: ColumnStat }) {
  const meta = KIND_META[col.kind] ?? KIND_META.categorical;
  const Icon = meta.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-800 text-sm truncate" title={col.name}>{col.name}</div>
          <div className="text-[10px] text-slate-400">{meta.label} · {col.distinct} distinto(s)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="text-slate-500">Preenchidos: <span className="font-semibold text-slate-700">{col.count}</span></div>
        <div className="text-slate-500">Nulos: <span className={`font-semibold ${col.null_pct > 30 ? "text-red-600" : "text-slate-700"}`}>{col.null_pct}%</span></div>
      </div>

      {col.kind === "numeric" && col.numeric && (
        <>
          <div className="mb-4"><MiniBars values={col.numeric.histogram.counts} /></div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <Kv k="mín" v={fmt(col.numeric.min)} /><Kv k="média" v={fmt(col.numeric.mean)} /><Kv k="máx" v={fmt(col.numeric.max)} />
            <Kv k="mediana" v={fmt(col.numeric.median)} /><Kv k="desvio" v={fmt(col.numeric.std)} /><Kv k="p95" v={fmt(col.numeric.p95)} />
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
              <span className="text-[11px] text-slate-600 truncate w-24" title={t.value}>{t.value}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">{t.pct}%</span>
            </div>
          ))}
          {col.categorical.is_text && <div className="text-[10px] text-slate-400 mt-1 italic">Alta cardinalidade (texto)</div>}
        </div>
      )}

      {col.kind === "datetime" && col.datetime && (
        <div className="text-[11px] space-y-1">
          <Kv k="início" v={new Date(col.datetime.min).toLocaleString()} />
          <Kv k="fim" v={new Date(col.datetime.max).toLocaleString()} />
        </div>
      )}

      {col.kind === "boolean" && col.boolean && (
        <MiniBars values={[col.boolean.true, col.boolean.false]} labels={["Sim", "Não"]} color="#10b981" />
      )}
    </div>
  );
}

const Kv = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="bg-slate-50 rounded px-1.5 py-1"><span className="text-slate-400">{k}</span> <span className="font-semibold text-slate-700">{v}</span></div>
);

function QualityList({ title, items, tone, empty }: { title: string; items: string[]; tone: "amber" | "red" | "emerald"; empty: string }) {
  const toneCls = { amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", emerald: "bg-emerald-50 text-emerald-700" }[tone];
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</div>
      {items.length === 0 ? (
        <span className="text-slate-400">{empty}</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((c) => <span key={c} className={`px-1.5 py-0.5 rounded ${toneCls} font-medium`}>{c}</span>)}
        </div>
      )}
    </div>
  );
}

function CorrHeatmap({ corr }: { corr: Corr }) {
  if (!corr.columns.length) return null;
  const cell = (v: number | null) => {
    if (v == null) return "#f1f5f9";
    const a = Math.abs(v);
    return v >= 0 ? `rgba(37,99,235,${a})` : `rgba(220,38,38,${a})`;
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700"><Sigma size={16} className="text-indigo-600" /> Correlações</div>
      <table className="text-[10px]">
        <thead><tr><th></th>{corr.columns.map((c) => <th key={c} className="px-1 py-1 text-slate-500 font-medium max-w-[60px] truncate" title={c}>{c}</th>)}</tr></thead>
        <tbody>
          {corr.matrix.map((row, i) => (
            <tr key={i}>
              <td className="pr-2 text-slate-500 font-medium text-right max-w-[80px] truncate" title={corr.columns[i]}>{corr.columns[i]}</td>
              {row.map((v, j) => (
                <td key={j} className="w-8 h-8 text-center text-white font-semibold" style={{ backgroundColor: cell(v) }} title={`${v ?? "—"}`}>
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

function TrendChart({ trend }: { trend: Trend }) {
  const pts = trend.series;
  const w = 600, h = 120, pad = 4;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const rng = max - min || 1;
  const xx = (i: number) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
  const yy = (v: number) => h - pad - ((v - min) / rng) * (h - pad * 2);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xx(i).toFixed(1)},${yy(p.v).toFixed(1)}`).join(" ");
  const area = `${path} L${xx(pts.length - 1)},${h - pad} L${xx(0)},${h - pad} Z`;
  const dirColor = trend.direction === "a subir" ? "#10b981" : trend.direction === "a descer" ? "#ef4444" : "#64748b";
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">📈 Tendência de {trend.measure} ({trend.freq})</div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: dirColor }}>
            {trend.direction} {trend.change_pct >= 0 ? "+" : ""}{trend.change_pct}%
          </span>
          <span className="text-[11px] text-slate-500">Previsão próx.: <b className="text-slate-800">{fmt(trend.forecast_next)}</b></span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
        <path d={area} fill={dirColor} opacity={0.1} />
        <path d={path} fill="none" stroke={dirColor} strokeWidth={2} />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{pts[0]?.t}</span><span>{pts[pts.length - 1]?.t}</span>
      </div>
    </section>
  );
}

function AnomaliesTable({ anomalies }: { anomalies: Anomalies }) {
  const cols = anomalies.rows[0] ? Object.keys(anomalies.rows[0].row).slice(0, 5) : [];
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
      <div className="text-sm font-semibold text-slate-700 mb-2">🚨 Anomalias — {anomalies.count} linha(s) fora do normal</div>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-slate-400">
          <th className="p-1.5">#</th><th className="p-1.5">Score</th>
          {cols.map((c) => <th key={c} className="p-1.5 truncate max-w-[120px]" title={c}>{c.split(".").pop()}</th>)}
        </tr></thead>
        <tbody>
          {anomalies.rows.map((r) => (
            <tr key={r.index} className="border-t border-slate-100">
              <td className="p-1.5 text-slate-400">{r.index}</td>
              <td className="p-1.5"><span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">{r.score}</span></td>
              {cols.map((c) => <td key={c} className="p-1.5 text-slate-600 truncate max-w-[120px]">{String(r.row[c] ?? "—")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SegmentsView({ segments }: { segments: Segments }) {
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-700 mb-3">👥 Segmentos / perfis — {segments.k} grupos</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.segments.map((s, i) => (
          <div key={s.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-md text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: palette[i % palette.length] }}>{i + 1}</span>
              <span className="text-xs text-slate-500">{s.size} · {s.pct}%</span>
            </div>
            <div className="space-y-0.5">
              {Object.entries(s.center).slice(0, 5).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[90px]" title={k}>{k.split(".").pop()}</span>
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

// ══════════════════════════ Página ══════════════════════════
// Forma mínima do resultado guardado pela página de Consultas.
type PersistedResult = {
  QueryPayload?: Record<string, unknown>;
  preview?: Record<string, unknown>[];
} | null;

function DataSciencePageInner() {
  const searchParams = useSearchParams();

  // ⚠️ O resultado da consulta é guardado em IndexedDB (via usePersistedState),
  // NÃO em localStorage. Lê-se pela mesma via (partilhada entre abas).
  const [persisted, , , loadingPersisted] = usePersistedState<PersistedResult>(
    "consu_QueryResultType",
    null
  );

  const [status, setStatus] = useState("Pronto");
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [columns, setColumns] = useState<ColumnStat[]>([]);
  const [corr, setCorr] = useState<Corr>({ columns: [], matrix: [] });
  const [quality, setQuality] = useState<Quality | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [anomalies, setAnomalies] = useState<Anomalies | null>(null);
  const [segments, setSegments] = useState<Segments | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Monta o pedido de análise a partir de: URL (?table=) OU do resultado
  // guardado da página de consultas (localStorage).
  const buildRequest = useCallback((): Record<string, unknown> | null => {
    const table = searchParams.get("table");
    if (table) {
      return {
        payload: {
          baseTable: table, table_list: [table], select: [], aliaisTables: {},
          where: [], joins: {}, limit: 5000,
        },
      };
    }
    if (persisted?.QueryPayload) {
      return { payload: { ...persisted.QueryPayload, limit: 5000 } };
    }
    if (Array.isArray(persisted?.preview) && persisted.preview.length) {
      return { rows: persisted.preview };
    }
    return null;
  }, [searchParams, persisted]);

  const analisar = useCallback(() => {
    const req = buildRequest();
    if (!req) {
      setError("Sem consulta para analisar. Executa uma consulta na página de Consultas, ou abre com ?table=nome.");
      return;
    }
    setError(null);
    setRunning(true);
    setCached(false);
    setOverview(null);
    setColumns([]);
    setCorr({ columns: [], matrix: [] });
    setQuality(null);
    setTrend(null);
    setAnomalies(null);
    setSegments(null);
    setInsights([]);
    setStatus("A ligar…");

    // fecha ligação anterior
    wsRef.current?.close();
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus("A pedir análise…");
      ws.send(JSON.stringify(req));
    };
    ws.onclose = () => { setConnected(false); setRunning(false); };
    ws.onerror = () => setStatus("Erro de ligação");
    ws.onmessage = (ev) => {
      let msg: { stage: string; data?: unknown; message?: string; cached?: boolean; n_rows?: number };
      try { msg = JSON.parse(ev.data); } catch { return; }
      switch (msg.stage) {
        case "fetching": setStatus("A obter dados…"); break;
        case "computing": setStatus(`A calcular… (${msg.n_rows ?? 0} linhas)`); break;
        case "overview": setOverview(msg.data as Overview); if (msg.cached) setCached(true); break;
        case "column": setColumns((prev) => [...prev, msg.data as ColumnStat]); break;
        case "correlations": setCorr(msg.data as Corr); break;
        case "quality": setQuality(msg.data as Quality); break;
        case "trend": setTrend(msg.data as Trend); break;
        case "anomalies": setAnomalies(msg.data as Anomalies); break;
        case "segments": setSegments(msg.data as Segments); break;
        case "insights": setInsights((msg.data as string[]) ?? []); break;
        case "done": setStatus(msg.cached ? "Concluído (cache)" : "Concluído"); setRunning(false); break;
        case "error": setError(msg.message ?? "Erro na análise"); setRunning(false); break;
      }
    };
  }, [buildRequest]);

  // Corre automaticamente assim que a fonte de dados estiver pronta:
  // ou o parâmetro ?table=, ou o resultado guardado (após carregar do IndexedDB).
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    const hasTable = !!searchParams.get("table");
    if (hasTable || !loadingPersisted) {
      autoRanRef.current = true;
      analisar();
    }
  }, [loadingPersisted, searchParams, analisar]);

  // Fecha o WebSocket ao sair.
  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const numericCount = useMemo(() => columns.filter((c) => c.kind === "numeric").length, [columns]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center">
            <BarChart3 size={20} />
          </span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Análise de Dados</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              {connected ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-slate-400" />}
              {status}{cached && " · cache"}
            </p>
          </div>
          <button
            onClick={analisar}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            {running ? "A analisar…" : "Reanalisar"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Overview */}
        {overview && (
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatTile label="Linhas" value={fmt(overview.n_rows)} />
            <StatTile label="Colunas" value={overview.n_cols} />
            <StatTile label="Numéricas" value={numericCount} />
            <StatTile label="Nulos" value={`${overview.null_pct}%`} sub={`${overview.total_nulls} células`} />
            <StatTile label="Duplicadas" value={overview.n_duplicated} />
            <StatTile label="Memória" value={`${overview.memory_kb} KB`} />
          </section>
        )}

        {/* Qualidade dos dados */}
        {quality && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full flex-shrink-0"
                style={{ background: `conic-gradient(${quality.score >= 80 ? "#10b981" : quality.score >= 50 ? "#f59e0b" : "#ef4444"} ${quality.score * 3.6}deg, #e2e8f0 0deg)` }}>
                <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{quality.score}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Qualidade</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <QualityList title="Colunas constantes" items={quality.constant_columns} tone="amber" empty="Nenhuma" />
                <QualityList title="Muitos nulos (≥50%)" items={quality.high_null_columns} tone="red" empty="Nenhuma" />
                <QualityList title="Chaves candidatas" items={quality.potential_keys} tone="emerald" empty="—" />
              </div>
            </div>
          </section>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2"><Lightbulb size={16} /> Insights automáticos</div>
            <ul className="space-y-1">
              {insights.map((ins, i) => <li key={i} className="text-sm text-amber-900 flex gap-2"><span>•</span>{ins}</li>)}
            </ul>
          </section>
        )}

        {/* Tendência (negócio) */}
        {trend && trend.series.length >= 2 && <TrendChart trend={trend} />}

        {/* Segmentos / perfis */}
        {segments && <SegmentsView segments={segments} />}

        {/* Anomalias */}
        {anomalies && anomalies.rows.length > 0 && <AnomaliesTable anomalies={anomalies} />}

        {/* Correlações */}
        {corr.columns.length >= 2 && <CorrHeatmap corr={corr} />}

        {/* Colunas */}
        {columns.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Colunas ({columns.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((c) => <ColumnCard key={c.name} col={c} />)}
            </div>
          </section>
        )}

        {/* Loading inicial */}
        {running && !overview && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
            <p className="text-sm">{status}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DataSciencePage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-400">A carregar…</div>}>
      <DataSciencePageInner />
    </Suspense>
  );
}
