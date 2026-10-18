"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  Play,
  Star,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Pencil,
  Table,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { QueryPayload } from "@/types";

type RecentItem = {
  id: number;
  query: string;
  payload: QueryPayload | null;
  base_table?: string | null;
  tables_involved?: string[] | null;
  executed_at?: string | null;
  duration_ms?: number | null;
  row_count?: number | null;
  is_favorite?: boolean;
  count: number;
  error_message?: string | null;
  success?: boolean;
  status?: "success" | "failed";
};

type Props = {
  /** Muda a cada execução para re-buscar o histórico (tempo real). */
  reloadSignal: number;
  /** Corre EXACTAMENTE a consulta guardada (reprodução fiel, inclui joins). */
  onRerun: (payload: QueryPayload) => void;
  /** Carrega a consulta e constrói o formulário inteiro para editar. */
  onLoad: (payload: QueryPayload) => void;
  /** Clicar numa sugestão de tabela. */
  onPickTable?: (table: string) => void;
  className?: string;
  defaultOpen?: boolean;
};

const PAGE_SIZE = 5;

type FilterType = "all" | "success" | "failed" | "favorites" | "joins";

const QueryHistoryPanel: React.FC<Props> = ({
  reloadSignal,
  onRerun,
  onLoad,
  onPickTable,
  className = "",
  defaultOpen = false,
}) => {
  const { api, user } = useSession();
  const { t } = useI18n();
  const connId = (user?.info_extra as { id_connection?: number } | undefined)?.id_connection;
  const dbName = (user?.info_extra as { name_db?: string } | undefined)?.name_db;

  const formatShortWhen = useCallback(
    (iso?: string | null): string => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return t("time.now") || "agora";
        if (diff < 3600) {
          const m = Math.floor(diff / 60);
          return (t("time.minutesAgo") || "há {m} min").replace("{m}", String(m));
        }
        if (diff < 86400) {
          const h = Math.floor(diff / 3600);
          return (t("time.hoursAgo") || "há {h} h").replace("{h}", String(h));
        }
        return d.toLocaleDateString();
      } catch {
        return "";
      }
    },
    [t]
  );

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [topTables, setTopTables] = useState<{ table: string; uses: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

  // Estados de busca, filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [togglingFavId, setTogglingFavId] = useState<number | null>(null);

  const fetchRecent = useCallback(async () => {
    if (!connId) {
      setRecent([]);
      setTopTables([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/history/recent-queries`, {
        params: { conn_id: connId, limit: 50 },
        withCredentials: true,
      });
      const d = data?.data ?? {};
      setRecent(Array.isArray(d.recent) ? d.recent : []);
      setTopTables(Array.isArray(d.topTables) ? d.topTables : []);
    } catch {
      // silencioso: o painel é auxiliar
    } finally {
      setLoading(false);
    }
  }, [api, connId]);

  useEffect(() => {
    setRecent([]);
    setTopTables([]);
    fetchRecent();
  }, [fetchRecent, reloadSignal, connId]);

  // Alternar favorito
  const handleToggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingFavId(id);
    try {
      const res = await api.post(`/history/${id}/favorite`, {}, { withCredentials: true });
      const newFav = res.data?.is_favorite;
      setRecent((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_favorite: newFav } : item))
      );
    } catch (err) {
      console.error("Erro ao alterar favorito:", err);
    } finally {
      setTogglingFavId(null);
    }
  };

  // Contadores para os filtros rápidos
  const filterCounts = useMemo(() => {
    const total = recent.length;
    const success = recent.filter(
      (r) => r.success !== false && (!r.error_message || r.error_message.trim() === "")
    ).length;
    const failed = recent.filter(
      (r) => r.success === false || Boolean(r.error_message && r.error_message.trim() !== "")
    ).length;
    const favorites = recent.filter((r) => r.is_favorite).length;
    const joins = recent.filter(
      (r) =>
        Boolean(r.payload?.joins && Object.keys(r.payload.joins).length > 0) ||
        (r.tables_involved?.length ?? 0) > 1 ||
        r.query?.toUpperCase().includes("JOIN")
    ).length;
    return { total, success, failed, favorites, joins };
  }, [recent]);

  // Lista filtrada por busca e filtros rápidos
  const filteredList = useMemo(() => {
    return recent.filter((item) => {
      const isFailed =
        item.success === false || Boolean(item.error_message && item.error_message.trim() !== "");
      const isSuccess = !isFailed;

      // 1. Busca por texto (SQL, tabela envolvida, tabela base, mensagem de erro)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesQuery = item.query?.toLowerCase().includes(term);
        const matchesTable = item.tables_involved?.some((t) => t.toLowerCase().includes(term));
        const matchesBase = item.base_table?.toLowerCase().includes(term);
        const matchesError = item.error_message?.toLowerCase().includes(term);
        if (!matchesQuery && !matchesTable && !matchesBase && !matchesError) return false;
      }

      // 2. Filtro específico por tabela
      if (selectedTableFilter) {
        const target = selectedTableFilter.toLowerCase();
        const matchesTbl =
          item.base_table?.toLowerCase() === target ||
          item.tables_involved?.some((t) => t.toLowerCase() === target);
        if (!matchesTbl) return false;
      }

      // 3. Filtros rápidos de status / tipo
      if (activeFilter === "success" && !isSuccess) return false;
      if (activeFilter === "failed" && !isFailed) return false;
      if (activeFilter === "favorites" && !item.is_favorite) return false;
      if (activeFilter === "joins") {
        const hasJoins =
          Boolean(item.payload?.joins && Object.keys(item.payload.joins).length > 0) ||
          (item.tables_involved?.length ?? 0) > 1 ||
          item.query?.toUpperCase().includes("JOIN");
        if (!hasJoins) return false;
      }

      return true;
    });
  }, [recent, searchTerm, selectedTableFilter, activeFilter]);

  // Reinicia a página para 1 quando muda busca ou filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeFilter, selectedTableFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, page]);

  if (!connId) {
    return (
      <div className={`border border-dashed border-gray-200 rounded-xl bg-gray-50/60 p-4 text-center ${className}`}>
        <p className="text-xs text-gray-500 font-medium">
          {t("history.noActiveConnection") || "Nenhuma conexão de base de dados ativa no momento."}
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs transition-all ${className}`}>
      {/* Cabeçalho colapsável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <History size={16} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {t("history.panelTitle") || "Histórico de Consultas & Auditoria"}
              </span>
              {dbName && (
                <span
                  className="text-[10px] font-mono font-semibold bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.2 rounded"
                  title={(t("history.currentConnectionId") || "Conexão atual ID: {id}").replace("{id}", String(connId))}
                >
                  {dbName}
                </span>
              )}
              {recent.length > 0 && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded-full">
                  {filteredList.length !== recent.length
                    ? `${filteredList.length} ${t("common.of") || "de"} ${recent.length}`
                    : recent.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
              {(t("history.panelSubtitle") || "Status de execução, sucesso, falhas e reutilização na conexão ativa ({db})").replace("{db}", dbName || `#${connId}`)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              fetchRecent();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title={t("history.refreshHistory") || "Atualizar histórico"}
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        </div>
      </button>

      {open && (
        <div className="p-3 sm:p-4 space-y-3.5 border-t border-gray-100 bg-white">
          {/* Barra de Busca e Filtros de Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("history.searchPlaceholder") || "Buscar por SQL, tabela, erro..."}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  title={t("history.clearSearch") || "Limpar busca"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros de Status & Tipo (Pills) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {/* Todas */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setSelectedTableFilter(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "all" && !selectedTableFilter
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span>{t("common.all") || "Todas"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === "all" && !selectedTableFilter
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {filterCounts.total}
                </span>
              </button>

              {/* Sucesso */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("success");
                  setSelectedTableFilter(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "success"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{t("history.querySuccess") || "Sucesso"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === "success"
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {filterCounts.success}
                </span>
              </button>

              {/* Falhas */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("failed");
                  setSelectedTableFilter(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "failed"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>{t("history.queryFailed") || "Falhou"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === "failed"
                      ? "bg-rose-500 text-white"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {filterCounts.failed}
                </span>
              </button>

              {/* Favoritas */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("favorites");
                  setSelectedTableFilter(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "favorites"
                    ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Star
                  className={`w-3 h-3 ${
                    activeFilter === "favorites"
                      ? "fill-white text-white"
                      : "text-amber-500 fill-amber-500"
                  }`}
                />
                <span>{t("history.favorites") || "Favoritas"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === "favorites"
                      ? "bg-amber-400 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {filterCounts.favorites}
                </span>
              </button>

              {/* Com JOIN */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("joins");
                  setSelectedTableFilter(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === "joins"
                    ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{t("history.withJoins") || "JOINs"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === "joins"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {filterCounts.joins}
                </span>
              </button>
            </div>
          </div>

          {/* Filtro ativo por tabela específica */}
          {selectedTableFilter && (
            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              <span>
                {t("history.filteredByTablePrefix") || "Filtrado por tabela:"} <strong>{selectedTableFilter}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTableFilter(null)}
                className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 transition-colors"
                title={t("history.removeTableFilter") || "Remover filtro de tabela"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sugestões: tabelas mais usadas */}
          {topTables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 mr-1">
                <Sparkles size={12} className="text-blue-600" /> {t("history.suggestions") || "Sugestões:"}
              </span>
              {topTables.map((s) => (
                <div
                  key={s.table}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-2xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => onPickTable?.(s.table)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    title={(t("history.pickTableTitle") || "Adicionar tabela '{table}' ao formulário ({uses} utilizações)").replace("{table}", s.table).replace("{uses}", String(s.uses))}
                  >
                    <Table size={12} className="text-gray-400" />
                    <span>{s.table}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({s.uses})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTableFilter(selectedTableFilter === s.table ? null : s.table)
                    }
                    className={`px-1.5 py-1 text-[10px] border-l border-gray-200 hover:bg-gray-100 transition-colors ${
                      selectedTableFilter === s.table
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-gray-400"
                    }`}
                    title={(t("history.filterByTableTitle") || "Filtrar histórico por '{table}'").replace("{table}", s.table)}
                  >
                    <Filter size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lista de Consultas com Indicador de Status */}
          {filteredList.length === 0 ? (
            <div className="text-center py-6 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-gray-500">
                {searchTerm || activeFilter !== "all" || selectedTableFilter
                  ? t("history.noSearchResults") || "Nenhuma consulta encontrada com os filtros selecionados."
                  : t("history.noQueriesFound") || "Ainda não há consultas no histórico para esta conexão."}
              </p>
              {(searchTerm || activeFilter !== "all" || selectedTableFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                    setSelectedTableFilter(null);
                  }}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  {t("history.clearFilters") || "Limpar filtros"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedList.map((it) => {
                const isFailed =
                  it.success === false ||
                  Boolean(it.error_message && it.error_message.trim() !== "");

                return (
                  <div
                    key={it.id}
                    className={`group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all shadow-2xs ${
                      isFailed
                        ? "border-rose-200/90 bg-rose-50/20 hover:border-rose-300 hover:bg-rose-50/40"
                        : "border-gray-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/25"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {/* Linha Superior: Status de Execução + Favorito + SQL */}
                      <div className="flex items-center gap-2">
                        {/* Indicador de Status Executado: Sucesso vs Falha */}
                        {isFailed ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0"
                            title={it.error_message || t("history.queryFailed") || "Consulta falhou"}
                          >
                            <XCircle size={12} className="text-rose-600" />
                            <span>{t("history.queryFailed") || "Falhou"}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                            title={t("history.querySuccess") || "Consulta executada com sucesso"}
                          >
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{t("history.querySuccess") || "Sucesso"}</span>
                          </span>
                        )}

                        {/* Botão de Favorito */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(it.id, e)}
                          className="p-0.5 hover:scale-110 transition-transform shrink-0"
                          title={it.is_favorite ? (t("history.removeFromFavorites") || "Remover dos favoritos") : (t("history.markFavorite") || "Marcar como favorito")}
                          disabled={togglingFavId === it.id}
                        >
                          <Star
                            size={14}
                            className={
                              it.is_favorite
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300 hover:text-amber-400"
                            }
                          />
                        </button>

                        {/* SQL Query */}
                        <code
                          className="text-xs font-mono text-gray-800 truncate block font-medium"
                          title={it.query}
                        >
                          {it.query}
                        </code>
                      </div>

                      {/* Exibição da mensagem de erro se a consulta falhou */}
                      {isFailed && it.error_message && (
                        <div
                          className="mt-1.5 text-[11px] font-mono text-rose-700 bg-rose-50/90 px-2.5 py-1 rounded-lg border border-rose-200 flex items-start gap-1.5"
                          title={it.error_message}
                        >
                          <AlertTriangle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                          <span className="truncate">{it.error_message}</span>
                        </div>
                      )}

                      {/* Metadados de Execução: Data, Duração, Linhas, Tabelas */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={11} className="text-gray-400" />
                          <span>{formatShortWhen(it.executed_at)}</span>
                        </span>

                        {typeof it.duration_ms === "number" && (
                          <span className="font-mono text-gray-500">· {it.duration_ms}ms</span>
                        )}

                        {typeof it.row_count === "number" && !isFailed && (
                          <span className="font-semibold text-gray-600">
                            · {it.row_count} {t("history.rows") || "linhas"}
                          </span>
                        )}

                        {it.count > 1 && <span>· {it.count}×</span>}

                        {(it.tables_involved?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-gray-400">· {t("history.tables") || "Tabelas:"}</span>
                            {it.tables_involved!.map((tbl) => (
                              <button
                                key={tbl}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPickTable?.(tbl);
                                }}
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-800 text-gray-700 font-mono text-[10px] rounded border border-gray-200 hover:border-blue-300 transition-colors"
                                title={(t("history.selectTable") || "Selecionar tabela '{table}'").replace("{table}", tbl)}
                              >
                                {tbl}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações: Editar e Executar */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <button
                        type="button"
                        disabled={!it.payload}
                        onClick={() => it.payload && onLoad(it.payload)}
                        className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                        title={
                          it.payload
                            ? t("history.loadIntoBuilder") || "Construir formulário e editar no construtor"
                            : t("history.noPayload") || "Sem payload estruturado"
                        }
                      >
                        <Pencil size={13} />
                        <span>{t("common.edit") || "Editar"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!it.payload}
                        onClick={() => it.payload && onRerun(it.payload)}
                        className={`px-2 py-1.5 text-xs font-bold border rounded-lg flex items-center gap-1 transition-colors shadow-2xs ${
                          isFailed
                            ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                        title={
                          it.payload
                            ? isFailed
                              ? t("history.retryTitle") || "Tentar executar novamente"
                              : t("history.rerunAsIs") || "Executar novamente"
                            : t("history.noPayload") || "Sem payload estruturado"
                        }
                      >
                        <Play size={13} />
                        <span className="hidden sm:inline">
                          {isFailed ? (t("history.retry") || "Re-tentar") : (t("history.run") || "Executar")}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {filteredList.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
              <div>
                {t("common.showing") || "A mostrar"}{" "}
                <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, filteredList.length)}</strong>{" "}
                {t("common.of") || "de"}{" "}
                <strong>{filteredList.length}</strong>{" "}
                {t("history.queries") || "consultas"}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed text-gray-600 flex items-center gap-1 font-medium transition-colors"
                  title={t("history.previousPage") || "Página anterior"}
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">{t("history.previous") || "Anterior"}</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-gray-300 px-0.5">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                            page === p
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed text-gray-600 flex items-center gap-1 font-medium transition-colors"
                  title={t("history.nextPage") || "Próxima página"}
                >
                  <span className="hidden sm:inline">{t("history.next") || "Próxima"}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryHistoryPanel;
