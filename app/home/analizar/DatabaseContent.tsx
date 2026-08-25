"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import { hasPermission } from "@/permissions_val";
import {
  HardDrive,
  Activity,
  AlertOctagon,
  RefreshCw,
  PlugZap,
  Layers,
} from "lucide-react";

import { MetricCard } from "./ComponentAnlytics/AnalyticsUI";
import { AuditedQueries, AuditTrail } from "./ComponentAnlytics/AuditPanels";
import { QueryHistory } from "../historico/types";

/* =======================
   TYPES
======================= */
interface DbMetrics {
  tableSizeTotal: string;
  rowCountTotal: number;
  activeTransactions: number;
  deadlocks: number;
  engine?: string;
}

const PAGE_SIZE = 12;

/* =======================
   CACHE LOCAL (só métricas + trilha; a tabela pagina em servidor)
======================= */
let memoryCache: {
  metrics?: DbMetrics;
  recent?: QueryHistory[];
  timestamp?: number;
} = {};

const fmtNumber = (n?: number | null) =>
  typeof n === "number" ? n.toLocaleString("pt-PT") : "-";

/* =======================
   COMPONENT
======================= */
export function DatabaseModule({
  refreshKey = 0,
  downloadSignal = 0,
}: {
  refreshKey?: number;
  downloadSignal?: number;
}) {
  const { user, api } = useSession();

  const [metrics, setMetrics] = useState<DbMetrics | null>(null);
  const [recent, setRecent] = useState<QueryHistory[]>([]); // trilha (últimos 6)
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [noConnection, setNoConnection] = useState(false);

  // Tabela paginada
  const [queries, setQueries] = useState<QueryHistory[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [page, setPage] = useState(0); // 0-based
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const canExport = hasPermission(user?.permissions ?? [], "analytics:db:export");

  /* =======================
     MÉTRICAS + TRILHA (últimos 6)
  ======================= */
  const loadTopLevel = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && memoryCache.timestamp && now - memoryCache.timestamp < 30_000) {
        setMetrics(memoryCache.metrics || null);
        setRecent(memoryCache.recent || []);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingMetrics(true);
      setNoConnection(false);

      const metricsPromise = api
        .get<DbMetrics>("/analytics/db/", { signal: controller.signal })
        .then((r) => r.data)
        .catch((err) => {
          if (err?.name === "CanceledError") return undefined;
          if (err?.response?.status === 400) setNoConnection(true);
          else console.error("Erro ao carregar métricas:", err);
          return null;
        });

      const recentPromise = api
        .get<QueryHistory[]>("/history/", {
          params: { limit: 6 },
          signal: controller.signal,
        })
        .then((r) => r.data)
        .catch(() => null);

      const [metricsRes, recentRes] = await Promise.all([metricsPromise, recentPromise]);
      if (controller.signal.aborted) return;

      if (metricsRes !== undefined) setMetrics(metricsRes || null);
      if (recentRes) setRecent(recentRes);

      memoryCache = {
        metrics: metricsRes || undefined,
        recent: recentRes || undefined,
        timestamp: Date.now(),
      };
      setLoadingMetrics(false);
    },
    [api]
  );

  /* =======================
     TABELA PAGINADA (offset/limit + pesquisa no servidor)
  ======================= */
  const loadQueries = useCallback(
    async (pageToLoad: number, term: string) => {
      setLoadingQueries(true);
      try {
        const { data } = await api.get<QueryHistory[]>("/history/", {
          params: {
            limit: PAGE_SIZE,
            offset: pageToLoad * PAGE_SIZE,
            ...(term.trim() ? { search: term.trim() } : {}),
          },
        });
        const list = data ?? [];
        setQueries(list);
        // Há próxima página se recebemos uma página cheia.
        setHasNext(list.length === PAGE_SIZE);
      } catch (err) {
        if ((err as Error)?.name !== "CanceledError") {
          console.error("Erro ao carregar consultas:", err);
        }
      } finally {
        setLoadingQueries(false);
      }
    },
    [api]
  );

  /* AUTO LOAD + heartbeat das métricas/trilha */
  useEffect(() => {
    loadTopLevel();
    const interval = setInterval(() => loadTopLevel(), 60_000);
    return () => {
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [loadTopLevel]);

  /* Refresh do topo → recarrega tudo e volta à página 1 */
  useEffect(() => {
    if (!refreshKey) return;
    loadTopLevel(true);
    setPage(0);
    loadQueries(0, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  /* Pesquisa (debounce) → volta à página 1 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadQueries(0, search);
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  /* Mudança de página */
  const goToPage = (p: number) => {
    if (p < 0) return;
    setPage(p);
    loadQueries(p, search);
  };

  /* =======================
     EXPORT CSV (página atual)
  ======================= */
  const exportCsv = useCallback(() => {
    if (!queries.length) return;
    const cabecalho = ["id", "tipo", "origem", "utilizador", "duracao_ms", "estado", "executado_em"];
    const linhas = queries.map((q) =>
      [
        q.id,
        q.query_type || "",
        q.app_source || "",
        q.executed_by || "",
        q.duration_ms ?? 0,
        q.error_message ? "erro" : "sucesso",
        q.executed_at || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [cabecalho.join(","), ...linhas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultas-auditadas-p${page + 1}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queries, page]);

  useEffect(() => {
    if (downloadSignal && canExport) exportCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadSignal]);

  /* =======================
     UI
  ======================= */
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border border-blue-200 uppercase">
            Engine {metrics?.engine || "—"}
          </span>
          {noConnection ? (
            <span className="text-amber-600 text-[10px] font-bold">● SEM CONEXÃO</span>
          ) : (
            <span className="text-emerald-600 text-[10px] font-bold animate-pulse">● LIVE</span>
          )}
        </div>

        <button
          onClick={() => {
            loadTopLevel(true);
            loadQueries(page, search);
          }}
          className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline"
        >
          <RefreshCw size={14} className={loadingMetrics ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* SEM CONEXÃO ATIVA */}
      {noConnection && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
            <PlugZap className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-amber-800">Nenhuma conexão de base de dados ativa</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Ative uma conexão na página <span className="font-semibold">Conexões</span> para ver
              as métricas em tempo real. O histórico de consultas continua disponível abaixo.
            </p>
          </div>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Volume Total"
          value={loadingMetrics ? "..." : metrics?.tableSizeTotal || "-"}
          subLabel="Storage Engine"
          icon={<HardDrive />}
        />
        <MetricCard
          label="Registos"
          value={loadingMetrics ? "..." : fmtNumber(metrics?.rowCountTotal)}
          subLabel="Linhas totais"
          icon={<Layers />}
        />
        <MetricCard
          label="Transações"
          value={loadingMetrics ? "..." : metrics?.activeTransactions ?? "-"}
          subLabel="Ativas agora"
          icon={<Activity className="text-emerald-500" />}
        />
        <MetricCard
          label="Deadlocks"
          value={loadingMetrics ? "..." : metrics?.deadlocks ?? "-"}
          subLabel="Integridade"
          icon={<AlertOctagon className="text-red-500" />}
        />
      </div>

      {/* AUDIT: QUERIES + TRAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <AuditedQueries
          queries={queries}
          loading={loadingQueries}
          canExport={canExport}
          onExport={exportCsv}
          search={search}
          onSearchChange={setSearch}
          page={page}
          pageSize={PAGE_SIZE}
          hasNext={hasNext}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
        <AuditTrail queries={recent} loading={loadingMetrics && recent.length === 0} />
      </div>
    </div>
  );
}
