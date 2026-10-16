"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import usePersistedState from "@/hook/localStoreUse";
import api from "@/context/axioCuston";

import {
  Quality,
  Trend,
  Anomalies,
  Segments,
  ColumnStat,
  Overview,
  Corr,
  PersistedResult,
  fmt,
  StatTile,
  ColumnCard,
  QualityCard,
  CorrHeatmap,
  TrendChart,
  AnomaliesTable,
  SegmentsView,
  InsightsCard,
  DataScienceHeader,
} from "./component";

// ── URL do WebSocket ──
const WS_BASE =
  ((process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/^http/, "ws").replace(/\/$/, "")) +
  "/datascience/ws";

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)(?:bk_access_token|access_token)=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

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
  const hasReceivedDataRef = useRef(false);

  // Monta o pedido de análise a partir de: chave encriptada (?key=),
  // URL (?table=) OU da consulta guardada na página de consultas (IndexedDB).
  const buildRequest = useCallback((): Record<string, unknown> | null => {
    const rawKey = searchParams.get("key");
    if (rawKey) {
      let key = rawKey;
      try {
        key = decodeURIComponent(rawKey);
      } catch {}
      return { key };
    }
    const table = searchParams.get("table");
    if (table) {
      return {
        query: {
          baseTable: table,
          table_list: [table],
          select: [],
          aliaisTables: {},
          where: [],
          joins: {},
          limit: null,
        },
      };
    }
    const queryObj = persisted?.QueryPayload ?? (persisted as any)?.queryPayload;
    if (queryObj) {
      return { query: { ...queryObj, limit: null } };
    }
    return null;
  }, [searchParams, persisted]);

  // Fallback via REST API (caso WebSocket caia ou porta de WS não responda)
  const executarFallbackRest = useCallback(async (req: Record<string, unknown>) => {
    setStatus("A carregar via API REST…");
    try {
      const res = await api.post("/datascience/analyze", req, { timeout: 60000 });
      if (res.data && res.data.success) {
        const d = res.data;
        if (d.overview) setOverview(d.overview);
        if (d.columns) setColumns(d.columns);
        if (d.correlations) setCorr(d.correlations);
        if (d.quality) setQuality(d.quality);
        if (d.trend) setTrend(d.trend);
        if (d.anomalies) setAnomalies(d.anomalies);
        if (d.segments) setSegments(d.segments);
        if (d.insights) setInsights(d.insights);
        if (d.cached) setCached(true);
        setStatus("Concluído");
        setError(null);
      } else {
        setError(res.data?.message || "Não foi possível carregar a análise.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao conectar com o servidor para análise.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setRunning(false);
    }
  }, []);

  const analisar = useCallback(() => {
    const req = buildRequest();
    if (!req) {
      setError(
        "Sem consulta para analisar. Executa uma consulta na página de Consultas, ou abre com ?table=nome."
      );
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
    hasReceivedDataRef.current = false;

    // Fecha ligação anterior
    wsRef.current?.close();

    const token = getAuthToken();
    const wsUrl = token
      ? `${WS_BASE}?token=${encodeURIComponent(token)}`
      : WS_BASE;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (e) {
      // Se nem conseguir instanciar WebSocket, vai direto para REST
      executarFallbackRest(req);
      return;
    }

    ws.onopen = () => {
      setConnected(true);
      setStatus("A pedir análise…");
      ws.send(JSON.stringify(req));
    };

    ws.onclose = () => {
      setConnected(false);
      // Se fechou sem receber nenhum dado da análise, aciona fallback REST automaticamente
      if (!hasReceivedDataRef.current) {
        executarFallbackRest(req);
      } else {
        setRunning(false);
      }
    };

    ws.onerror = () => {
      setStatus("A tentar ligação de recurso…");
    };

    ws.onmessage = (ev) => {
      let msg: {
        stage: string;
        data?: unknown;
        message?: string;
        cached?: boolean;
        n_rows?: number;
      };
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.stage) {
        case "fetching":
          hasReceivedDataRef.current = true;
          setStatus("A obter dados da consulta…");
          break;
        case "computing":
          hasReceivedDataRef.current = true;
          setStatus(`A calcular estatísticas… (${msg.n_rows ?? 0} linhas)`);
          break;
        case "overview":
          hasReceivedDataRef.current = true;
          setOverview(msg.data as Overview);
          if (msg.cached) setCached(true);
          break;
        case "column":
          hasReceivedDataRef.current = true;
          setColumns((prev) => [...prev, msg.data as ColumnStat]);
          break;
        case "correlations":
          hasReceivedDataRef.current = true;
          setCorr(msg.data as Corr);
          break;
        case "quality":
          hasReceivedDataRef.current = true;
          setQuality(msg.data as Quality);
          break;
        case "trend":
          hasReceivedDataRef.current = true;
          setTrend(msg.data as Trend);
          break;
        case "anomalies":
          hasReceivedDataRef.current = true;
          setAnomalies(msg.data as Anomalies);
          break;
        case "segments":
          hasReceivedDataRef.current = true;
          setSegments(msg.data as Segments);
          break;
        case "insights":
          hasReceivedDataRef.current = true;
          setInsights((msg.data as string[]) ?? []);
          break;
        case "done":
          hasReceivedDataRef.current = true;
          setStatus(msg.cached ? "Concluído (cache)" : "Concluído");
          setRunning(false);
          break;
        case "error":
          setError(msg.message ?? "Erro na análise");
          setRunning(false);
          break;
      }
    };
  }, [buildRequest, executarFallbackRest]);

  // Corre automaticamente assim que a fonte de dados estiver pronta:
  // chave encriptada (?key=), parâmetro ?table=, ou o resultado guardado (após carregar do IndexedDB).
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    const hasKey = !!searchParams.get("key");
    const hasTable = !!searchParams.get("table");
    if (hasKey || hasTable || !loadingPersisted) {
      autoRanRef.current = true;
      analisar();
    }
  }, [loadingPersisted, searchParams, analisar]);

  // Fecha o WebSocket ao sair.
  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const numericCount = useMemo(
    () => columns.filter((c) => c.kind === "numeric").length,
    [columns]
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <DataScienceHeader
        connected={connected}
        status={status}
        cached={cached}
        running={running}
        onAnalyse={analisar}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={analisar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {/* Overview */}
        {overview && (
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatTile label="Linhas" value={fmt(overview.n_rows)} />
            <StatTile label="Colunas" value={overview.n_cols} />
            <StatTile label="Numéricas" value={numericCount} />
            <StatTile
              label="Nulos"
              value={`${overview.null_pct}%`}
              sub={`${overview.total_nulls} células`}
            />
            <StatTile label="Duplicadas" value={overview.n_duplicated} />
            <StatTile label="Memória" value={`${overview.memory_kb} KB`} />
          </section>
        )}

        {/* Qualidade dos dados */}
        {quality && <QualityCard quality={quality} />}

        {/* Insights */}
        {insights.length > 0 && <InsightsCard insights={insights} />}

        {/* Tendência (negócio) */}
        {trend && trend.series.length >= 2 && <TrendChart trend={trend} />}

        {/* Segmentos / perfis */}
        {segments && <SegmentsView segments={segments} />}

        {/* Anomalias */}
        {anomalies && anomalies.rows.length > 0 && (
          <AnomaliesTable anomalies={anomalies} />
        )}

        {/* Correlações */}
        {corr.columns.length >= 2 && <CorrHeatmap corr={corr} />}

        {/* Colunas */}
        {columns.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Colunas ({columns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((c) => (
                <ColumnCard key={c.name} col={c} />
              ))}
            </div>
          </section>
        )}

        {/* Loading inicial */}
        {running && !overview && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{status}</p>
          </div>
        )}

        {/* Estado vazio quando não está a correr nem há overview */}
        {!running && !overview && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center">
            <p className="text-sm mb-4">Nenhuma análise carregada de momento.</p>
            <button
              onClick={analisar}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
            >
              Iniciar Análise
            </button>
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
