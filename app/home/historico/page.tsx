/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Download,
  Search,
  RefreshCcw,
  BarChart3,
  Clock,
  Terminal,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { hasPermission } from "@/permissions_val";
import { quickExportToCsv } from "@/app/services/relatorio";
import { QUERY_TYPES, QueryHistory } from "./types";
import {
  AccessDeniedUI,
  DetailModal,
  MiniStat,
  SortDirection,
  SortField,
  StatusBadge,
  Th,
  getLogStatus,
  getActionStyle,
} from "./component";

export default function HistoricoPage() {
  const { user, api } = useSession();
  const { t } = useI18n();
  const permissions = user?.permissions ?? [];

  const canView = hasPermission(permissions, "logs:view");
  const canExport = hasPermission(permissions, "logs:export");

  const [logs, setLogs] = useState<QueryHistory[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<QueryHistory | null>(null);
  const [sortField, setSortField] = useState<SortField>("executed_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  /* =======================
      🔥 DEBOUNCE SEARCH
  ======================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const parseDate = (date: string) => new Date(date).getTime();

  /* =======================
      FETCH
  ======================= */

  const fetchParams = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.append("search", debouncedSearch);
    if (filter !== "Todos") params.append("query_type", filter);
    if(user?.info_extra?.id_connection) params.append("conn_id", (user.info_extra.id_connection).toString());

    params.append("limit", "50");

    return params.toString();
  }, [debouncedSearch, filter]);

  const handleRefresh = useCallback(async () => {
    if (!canView) return;

    setIsLoading(true);

    try {
      const response = await api.get(`/history?${fetchParams}`,{timeout: 10000});
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.logs;

      setLogs(data || []);
      setPage(1);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [api, canView, fetchParams]);
  useEffect(() => {
    if (canView) handleRefresh();
  }, [handleRefresh, canView]);

  /* =======================
      STATS
  ======================= */
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return { total: 0, success: 0, error: 0, warning: 0, avgDuration: 0 };
    }

    let success = 0,
      error = 0,
      warning = 0,
      totalDuration = 0;

    for (const l of logs) {
      const status = getLogStatus(l);
      if (status === "success") success++;
      else if (status === "error") error++;
      else if (status === "warning") warning++;

      totalDuration += l.duration_ms || 0;
    }

    return {
      total: logs.length,
      success,
      error,
      warning,
      avgDuration: totalDuration / logs.length,
    };
  }, [logs]);

  /* =======================
      FILTER + SORT
  ======================= */
  const filteredAndSortedLogs = useMemo(() => {
    let result = logs;

    // 🔥 Só filtros que NÃO estão no backend
    if (date) {
      result = result.filter((l) => l.executed_at.startsWith(date));
    }

    if (statusFilter !== "all") {
      result = result.filter((l) => getLogStatus(l) === statusFilter);
    }

    const sorted = [...result].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "executed_at") {
        return sortDirection === "asc"
          ? parseDate(a.executed_at) - parseDate(b.executed_at)
          : parseDate(b.executed_at) - parseDate(a.executed_at);
      }
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      if (typeof aVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [logs, date, statusFilter, sortField, sortDirection]);

  /* =======================
      PAGINATION
  ======================= */
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(start, start + itemsPerPage);
  }, [filteredAndSortedLogs, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage) || 1;

  /* =======================
      GUARD
  ======================= */
  if (!canView) return <AccessDeniedUI t={t} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. HEADER */}
        <input
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="..."
        />
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mr-4 shadow-sm">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {t("history.title") || "Histórico de Atividades"}
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  {t("history.subtitle") || "Security Audit Log"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canExport && (
                <button
                  onClick={() => quickExportToCsv(filteredAndSortedLogs, "audit_log")}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Download size={16} /> {t("actions.exportCsv") || "Exportar CSV"}
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all shadow-sm ${isLoading ? "animate-spin text-blue-600" : ""
                  }`}
                title={t("history.refresh") || "Atualizar"}
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. ESTATÍSTICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MiniStat label={t("history.statsTotal") || "Total Ops"} value={stats.total} icon={<BarChart3 size={18} />} color="text-blue-600" />
          <MiniStat label={t("history.statsSuccess") || "Sucesso"} value={stats.success} icon={<CheckCircle2 size={18} />} color="text-green-600" />
          <MiniStat label={t("history.statsFail") || "Falhas"} value={stats.error} icon={<XCircle size={18} />} color="text-red-600" />
          <MiniStat label={t("history.statsWarn") || "Avisos"} value={stats.warning} icon={<AlertCircle size={18} />} color="text-amber-500" />
          <MiniStat label={t("history.statsLatency") || "Latência Avg"} value={`${Math.round(stats.avgDuration)}ms`} icon={<Clock size={18} />} color="text-purple-600" />
        </div>

        {/* 3. FILTROS */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-center shadow-sm">
          <div className="relative group md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder={t("history.searchPlaceholder") || "Pesquisar usuário, projeto..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
            />
          </div>

          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Todos">{t('history.allActions') || "Todas as Ações"}</option>
            {QUERY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("history.allStatus") || "Todos os Status"}</option>
            <option value="success">{t("history.statusSuccess") || "Sucesso"}</option>
            <option value="error">{t("history.statusError") || "Erro"}</option>
            <option value="warning">{t("history.statusWarning") || "Aviso"}</option>
          </select>
          <input
            type="date"
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* 4. TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {isLoading && logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
              <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-500 animate-pulse">Carregando auditoria...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/50">
                <div className="text-sm font-semibold text-gray-500">
                  {filteredAndSortedLogs.length} {t("history.entriesFound") || "Entradas encontradas"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Itens por página:</span>
                  <select
                    className="bg-white border border-gray-300 rounded text-xs py-1 px-2 focus:outline-none"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <Th field="executed_at" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                        {t("history.colTime") || "Timestamp"}
                      </Th>
                      <Th field="executed_by" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                        {t("history.colUser") || "Identidade"}
                      </Th>
                      <Th field="query_type" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                        {t("history.colAction") || "Operação"}
                      </Th>
                      <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t("history.colContext") || "Contexto"}
                      </th>
                      <Th field="duration_ms" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                        {t("history.colDuration") || "Latência"}
                      </Th>
                      <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                        {t("history.colStatus") || "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLogs.map((log) => {
                      const executedBy = log.executed_by || "System";
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="p-4 font-mono text-xs text-gray-500">
                            {new Date(log.executed_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700 uppercase border border-blue-100">
                                {executedBy.substring(0, 2)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{executedBy}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getActionStyle(log.query_type || "")}`}>
                              {log.query_type || "OTHER"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-gray-900 font-semibold">{log.app_source || "N/A"}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">Conn ID: {log.db_connection_id || "?"}</div>
                          </td>
                          <td className="p-4 font-mono text-sm text-gray-600">{log.duration_ms}ms</td>
                          <td className="p-4 text-right">
                            <StatusBadge status={getLogStatus(log)} />
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          {t("history.noLogsFound") || "Nenhum registro encontrado."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm border rounded-lg bg-white disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Página {page} de {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm border rounded-lg bg-white disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedLog && (
        <DetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          t={t}
        />
      )}
    </div>
  );
}