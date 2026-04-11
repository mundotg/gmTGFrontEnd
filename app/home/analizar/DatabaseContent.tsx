/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import { hasPermission } from "@/permissions_val";
import {
  HardDrive,
  Activity,
  AlertOctagon,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import {
  AuditTrailItem,
  MetricCard,
  QueryRowItem,
} from "./ComponentAnlytics/AnalyticsUI";
import { QueryHistory } from "../historico/types";

/* =======================
   TYPES
======================= */
interface DbMetrics {
  tableSizeTotal: string;
  rowCountTotal: number;
  activeTransactions: number;
  deadlocks: number;
}

/* =======================
   CACHE LOCAL (leve)
======================= */
let memoryCache: {
  metrics?: DbMetrics;
  queries?: QueryHistory[];
  timestamp?: number;
} = {};

/* =======================
   COMPONENT
======================= */
export function DatabaseModule() {
  const { user, api } = useSession();

  const [metrics, setMetrics] = useState<DbMetrics | null>(null);
  const [queries, setQueries] = useState<QueryHistory[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const canExport = hasPermission(user?.permissions ?? [], "analytics:db:export");

  /* =======================
     🔥 API SAFE FETCH
  ======================= */
  const fetchSafe = useCallback(
    async <T,>(url: string, signal: AbortSignal): Promise<T | null> => {
      try {
        const res = await api.get(url, { signal });
        return res.data;
      } catch (err: any) {
        if (err.name === "CanceledError") return null;
        console.error("Erro API:", err);
        return null;
      }
    },
    [api]
  );

  /* =======================
     LOAD DATA
  ======================= */
  const loadData = useCallback(async (force = false) => {
    // 🔥 evita spam de requests
    const now = Date.now();
    if (!force && memoryCache.timestamp && now - memoryCache.timestamp < 30_000) {
      setMetrics(memoryCache.metrics || null);
      setQueries(memoryCache.queries || []);
      return;
    }

    // 🔥 cancela request anterior
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoadingMetrics(true);
      setLoadingQueries(true);

      const [metricsRes, queriesRes] = await Promise.all([
        fetchSafe<DbMetrics>("/analytics/db", controller.signal),
        fetchSafe<QueryHistory[]>("/history?limit=10", controller.signal),
      ]);

      if (!controller.signal.aborted) {
        if (metricsRes) setMetrics(metricsRes);
        if (queriesRes) setQueries(queriesRes);

        // 🔥 cache local leve
        memoryCache = {
          metrics: metricsRes || undefined,
          queries: queriesRes || undefined,
          timestamp: Date.now(),
        };
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMetrics(false);
        setLoadingQueries(false);
      }
    }
  }, [fetchSafe]);

  /* =======================
     AUTO LOAD
  ======================= */
  useEffect(() => {
    loadData();

    // 🔥 refresh automático leve (tipo heartbeat)
    const interval = setInterval(() => {
      loadData();
    }, 60_000);

    return () => {
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [loadData]);

  /* =======================
     UI
  ======================= */
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase">
            Engine Status
          </span>
          <span className="text-emerald-500 text-[10px] font-bold animate-pulse">
            ● LIVE
          </span>
        </div>

        <button
          onClick={() => loadData(true)}
          className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:underline"
        >
          <ArrowRightLeft size={14} /> Atualizar
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Volume Total"
          value={loadingMetrics ? "..." : metrics?.tableSizeTotal || "-"}
          subLabel="Storage Engine"
          icon={<HardDrive />}
        />

        <MetricCard
          label="Transações"
          value={loadingMetrics ? "..." : metrics?.activeTransactions ?? "-"}
          subLabel="Transaction-safe"
          icon={<Activity className="text-emerald-400" />}
        />

        <MetricCard
          label="Deadlocks"
          value={loadingMetrics ? "..." : metrics?.deadlocks ?? "-"}
          subLabel="Integridade"
          icon={<AlertOctagon className="text-red-500" />}
        />

        <MetricCard
          label="Auditoria"
          value="Ativo"
          subLabel="MustaInf Protected"
          icon={<ShieldCheck className="text-blue-500" />}
        />
      </div>

      {/* TABLE + AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* QUERIES */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Consultas Auditadas
            </h3>

            <div className="flex gap-2 text-slate-500">
              {canExport && (
                <>
                  <FileDown size={16} className="cursor-pointer hover:text-white" />
                  <FileSpreadsheet size={16} className="cursor-pointer hover:text-white" />
                </>
              )}
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/5 font-mono">
              {loadingQueries && (
                <tr>
                  <td className="p-4 text-center text-gray-400">
                    <Loader2 className="animate-spin inline mr-2" size={14} />
                    Carregando...
                  </td>
                </tr>
              )}

              {!loadingQueries && queries.map((q) => (
                <QueryRowItem
                  key={q.id}
                  target={q.app_source || "Unknown"}
                  trail={`exec_${q.id}`}
                  duration={`${q.duration_ms || 0}ms`}
                  status={q.error_message ? "Error" : "Success"}
                />
              ))}

              {!loadingQueries && queries.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500">
                    Sem dados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AUDIT */}
        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/10 rounded-2xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">
            Trilha de Auditoria
          </h3>

          <div className="space-y-6">
            {queries.slice(0, 3).map((q) => (
              <AuditTrailItem
                key={q.id}
                user={q.executed_by || "system"}
                action={q.query_type || "UNKNOWN"}
                time={new Date(q.executed_at).toLocaleTimeString()}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}