"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Columns,
  Sigma,
  TrendingUp,
  Users,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";
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
  DataScienceHeader,
  OverviewDashboard,
  InteractiveColumnExplorer,
  CorrelationStudio,
  TrendStudio,
  ClustersStudio,
  AnomaliesStudio,
  StudyLabTab,
  StudyDictionaryModal,
  ColumnInspectorModal,
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

type TabType =
  | "overview"
  | "columns"
  | "correlations"
  | "trend"
  | "segments"
  | "anomalies"
  | "studylab";

function DataSciencePageInner() {
  const searchParams = useSearchParams();

  // Resultado da consulta guardado em IndexedDB (via usePersistedState)
  const [persisted, , , loadingPersisted] = usePersistedState<PersistedResult>(
    "consu_QueryResultType",
    null
  );

  const [status, setStatus] = useState("Pronto");
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  // Análise estatística devolvida pelo backend
  const [overview, setOverview] = useState<Overview | null>(null);
  const [columns, setColumns] = useState<ColumnStat[]>([]);
  const [corr, setCorr] = useState<Corr>({ columns: [], matrix: [] });
  const [quality, setQuality] = useState<Quality | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [anomalies, setAnomalies] = useState<Anomalies | null>(null);
  const [segments, setSegments] = useState<Segments | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  // Estados interativos de estudo e navegação
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [studyMode, setStudyMode] = useState<boolean>(true);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [dictionaryTermId, setDictionaryTermId] = useState<string>("media-vs-mediana");
  const [inspectedColumn, setInspectedColumn] = useState<ColumnStat | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  // Disparo automático na inicialização
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

  // Fecha o WebSocket ao desmontar
  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const handleOpenDictionaryTerm = useCallback((termId: string) => {
    setDictionaryTermId(termId);
    setIsDictionaryOpen(true);
  }, []);

  // Exportar resumo didático para a área de transferência
  const handleCopyStudySummary = useCallback(() => {
    if (!overview) return;
    const numCols = columns.filter((c) => c.kind === "numeric").length;
    const md = [
      `# 📊 Relatório Didático de Análise de Dados — MustaInf`,
      ``,
      `## 1. Volumetria & Saúde dos Dados`,
      `- **Total de Linhas:** ${fmt(overview.n_rows)}`,
      `- **Total de Colunas:** ${overview.n_cols} (${numCols} numéricas)`,
      `- **Campos Nulos:** ${overview.null_pct}% (${fmt(overview.total_nulls)} células vazias)`,
      `- **Linhas Duplicadas:** ${overview.n_duplicated}`,
      `- **Score de Qualidade dos Dados:** ${quality?.score ?? 100}/100`,
      ``,
      `## 2. Principais Insights Descobertos`,
      ...(insights.length > 0 ? insights.map((i) => `- ${i}`) : ["- Nenhum insight gerado."]),
      ``,
      `## 3. Resumo das Colunas Principais`,
      ...columns.slice(0, 10).map((c) => {
        if (c.kind === "numeric" && c.numeric) {
          return `- **${c.name}** (Numérica): Média = ${fmt(c.numeric.mean)}, Mediana = ${fmt(c.numeric.median)}, P95 = ${fmt(c.numeric.p95)}, Outliers = ${c.numeric.outliers?.count ?? 0}`;
        }
        return `- **${c.name}** (${c.kind}): ${c.distinct} valores distintos, ${c.null_pct}% nulos`;
      }),
      ``,
      `## 4. Tendências & Segmentação`,
      trend
        ? `- **Tendência (${trend.measure}):** ${trend.direction} (${trend.change_pct}%), previsão próxima: ${fmt(trend.forecast_next)}`
        : `- Nenhuma série temporal`,
      segments
        ? `- **Clusters (K-Means):** ${segments.k} perfis identificados (${segments.columns.join(", ")})`
        : `- Sem clusters`,
      anomalies
        ? `- **Anomalias:** ${anomalies.count} registros atípicos identificados`
        : `- Nenhuma anomalia crítica`,
      ``,
      `*Gerado pelo MustaInf Data Science Hub*`,
    ].join("\n");

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(md).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2500);
      });
    }
  }, [overview, quality, insights, columns, trend, segments, anomalies]);

  const tabs = [
    {
      id: "overview" as TabType,
      label: "Visão Geral & Saúde",
      icon: LayoutDashboard,
      badge: quality ? `${quality.score} pts` : undefined,
    },
    {
      id: "columns" as TabType,
      label: "Raio-X de Colunas",
      icon: Columns,
      badge: columns.length > 0 ? `${columns.length}` : undefined,
    },
    {
      id: "correlations" as TabType,
      label: "Correlações Cruzadas",
      icon: Sigma,
      badge: corr.columns.length >= 2 ? `${corr.columns.length}` : undefined,
    },
    {
      id: "trend" as TabType,
      label: "Tendências & Previsões",
      icon: TrendingUp,
      badge: trend ? trend.direction : undefined,
    },
    {
      id: "segments" as TabType,
      label: "Segmentos K-Means",
      icon: Users,
      badge: segments ? `${segments.k} clusters` : undefined,
    },
    {
      id: "anomalies" as TabType,
      label: "Anomalias",
      icon: ShieldAlert,
      badge: anomalies && anomalies.count > 0 ? `${anomalies.count}` : undefined,
      badgeColor: anomalies && anomalies.count > 0 ? "bg-rose-100 text-rose-700 font-bold" : undefined,
    },
    {
      id: "studylab" as TabType,
      label: "Laboratório de Estudo",
      icon: GraduationCap,
      badge: "Didático",
      badgeColor: "bg-indigo-100 text-indigo-700 font-bold",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Interactive Header */}
      <DataScienceHeader
        connected={connected}
        status={status}
        cached={cached}
        running={running}
        studyMode={studyMode}
        onToggleStudyMode={() => setStudyMode((prev) => !prev)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onCopyStudySummary={handleCopyStudySummary}
        copiedSummary={copiedSummary}
        onAnalyse={analisar}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Error Alert with Retry */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={analisar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {running && !overview && (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4 shadow-inner">
              <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{status}</p>
            <p className="text-xs text-slate-400 mt-1">
              Processando matrizes, percentis e detecção de anomalias com pandas...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!running && !overview && !error && (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Nenhuma análise estatística ativa
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
              Carregue os dados da sua consulta ou acesse a partir da aba de Consultas para visualizar métricas, tendências e guias de estudo interativos.
            </p>
            <button
              onClick={analisar}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              Iniciar Análise da Base
            </button>
          </div>
        )}

        {/* Loaded Dataset View */}
        {overview && (
          <div className="space-y-6">
            {/* Interactive Tab Navigation Bar */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-px">
              <nav className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            tab.badgeColor ||
                            (isActive
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Views */}
            {activeTab === "overview" && (
              <OverviewDashboard
                overview={overview}
                quality={quality}
                insights={insights}
                columns={columns}
                studyMode={studyMode}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
                onNavigateTab={(tab) => setActiveTab(tab as TabType)}
              />
            )}

            {activeTab === "columns" && (
              <InteractiveColumnExplorer
                columns={columns}
                studyMode={studyMode}
                onSelectColumn={(col) => setInspectedColumn(col)}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
              />
            )}

            {activeTab === "correlations" && (
              <CorrelationStudio
                corr={corr}
                studyMode={studyMode}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
              />
            )}

            {activeTab === "trend" && (
              <TrendStudio
                trend={trend}
                studyMode={studyMode}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
              />
            )}

            {activeTab === "segments" && (
              <ClustersStudio
                segments={segments}
                studyMode={studyMode}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
              />
            )}

            {activeTab === "anomalies" && (
              <AnomaliesStudio
                anomalies={anomalies}
                studyMode={studyMode}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
              />
            )}

            {activeTab === "studylab" && (
              <StudyLabTab
                overview={overview}
                quality={quality}
                columns={columns}
                onOpenDictionaryTerm={handleOpenDictionaryTerm}
                onNavigateTab={(tab) => setActiveTab(tab as TabType)}
              />
            )}
          </div>
        )}
      </main>

      {/* Column Inspector Modal */}
      <ColumnInspectorModal
        col={inspectedColumn}
        onClose={() => setInspectedColumn(null)}
        onOpenDictionaryTerm={handleOpenDictionaryTerm}
      />

      {/* Interactive Data Science Dictionary Modal */}
      <StudyDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        initialTermId={dictionaryTermId}
      />
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
