"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  X,
  Play,
  Download,
  Star,
  RefreshCw,
  Search,
  Sparkles,
  Copy,
  Check,
  Clock,
  Rows,
  Layers,
  Trash2,
  Filter,
  Code2,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { QueryPayload } from "@/types";

export type HistoryQueryItem = {
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

interface QueryHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reloadSignal?: number;
  onRerun: (payload: QueryPayload) => void;
  onLoad: (payload: QueryPayload) => void;
  onPickTable?: (table: string) => void;
  onHistoryCountChange?: (count: number) => void;
}

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffSec = (Date.now() - d.getTime()) / 1000;
    if (diffSec < 60) return "agora mesmo";
    if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `há ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 604800) return `há ${Math.floor(diffSec / 86400)} dias`;
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function QueryHistoryDrawer({
  isOpen,
  onClose,
  reloadSignal = 0,
  onRerun,
  onLoad,
  onPickTable,
  onHistoryCountChange,
}: QueryHistoryDrawerProps) {
  const { api, user } = useSession();
  const connId = (user?.info_extra as { id_connection?: number } | undefined)?.id_connection;

  const [recent, setRecent] = useState<HistoryQueryItem[]>([]);
  const [topTables, setTopTables] = useState<{ table: string; uses: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "success" | "failed" | "favorites" | "joins">("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [togglingFavId, setTogglingFavId] = useState<number | null>(null);
  const [clearingOld, setClearingOld] = useState(false);

  // Busca o histórico do backend
  const fetchHistory = useCallback(async () => {
    if (!connId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/history/recent-queries`, {
        params: { conn_id: connId, limit: 30 },
        withCredentials: true,
        timeout: 25000,
      });
      const d = data?.data ?? {};
      const list = Array.isArray(d.recent) ? d.recent : [];
      setRecent(list);
      setTopTables(Array.isArray(d.topTables) ? d.topTables : []);
      onHistoryCountChange?.(list.length);
    } catch (err) {
      console.error("Erro ao carregar histórico de consultas:", err);
    } finally {
      setLoading(false);
    }
  }, [api, connId, onHistoryCountChange]);

  useEffect(() => {
    setRecent([]);
    setTopTables([]);
    if (isOpen || reloadSignal > 0) {
      fetchHistory();
    }
  }, [fetchHistory, isOpen, reloadSignal, connId]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Copiar SQL
  const handleCopySQL = (id: number, sql: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Alternar Favorito
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

  // Limpar consultas antigas
  const handleClearOld = async () => {
    if (!confirm("Limpar consultas antigas com mais de 30 dias (consultas favoritas não serão apagadas)?")) return;
    setClearingOld(true);
    try {
      await api.delete(`/history/clear-old?days=30`, { withCredentials: true });
      await fetchHistory();
    } catch (err) {
      console.error("Erro ao limpar histórico:", err);
    } finally {
      setClearingOld(false);
    }
  };

  // Filtragem dos itens
  const filteredList = useMemo(() => {
    return recent.filter((item) => {
      const isFailed = item.success === false || Boolean(item.error_message && item.error_message.trim() !== "");
      const isSuccess = !isFailed;

      // Filtro de texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesQuery = item.query?.toLowerCase().includes(term);
        const matchesTable = item.tables_involved?.some((t) => t.toLowerCase().includes(term));
        const matchesBase = item.base_table?.toLowerCase().includes(term);
        const matchesError = item.error_message?.toLowerCase().includes(term);
        if (!matchesQuery && !matchesTable && !matchesBase && !matchesError) return false;
      }
      // Filtros rápidos
      if (activeFilter === "success" && !isSuccess) return false;
      if (activeFilter === "failed" && !isFailed) return false;
      if (activeFilter === "favorites" && !item.is_favorite) return false;
      if (activeFilter === "joins") {
        const hasJoins = (item.tables_involved?.length ?? 0) > 1 || item.query?.toUpperCase().includes("JOIN");
        if (!hasJoins) return false;
      }
      return true;
    });
  }, [recent, searchTerm, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop transparente/escurecido com blur suave */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md lg:max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
          
          {/* Header Superior */}
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Histórico de Consultas</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {recent.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {recent.length === 0 ? "Nenhuma consulta salva" : "Reutilize ou edite com 1 clique"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchHistory}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-200/60 rounded-lg transition-colors"
                title="Recarregar histórico"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sugestões de Tabelas Frequentes */}
          {topTables.length > 0 && (
            <div className="px-5 py-2.5 bg-blue-50/50 border-b border-blue-100">
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Tabelas frequentes:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {topTables.map((t) => (
                  <button
                    key={t.table}
                    type="button"
                    onClick={() => onPickTable?.(t.table)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white text-blue-700 hover:text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
                    title={`Clique para selecionar a tabela ${t.table} (${t.uses} usos)`}
                  >
                    <span>{t.table}</span>
                    <span className="text-[10px] text-blue-400 font-mono">({t.uses})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Busca e Filtros */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por tabela, coluna ou SQL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de filtro */}
            <div className="flex items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    activeFilter === "all"
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Todas ({recent.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("success")}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                    activeFilter === "success"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Sucesso ({recent.filter((r) => r.success !== false && (!r.error_message || r.error_message.trim() === "")).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("failed")}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                    activeFilter === "failed"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  Falhou ({recent.filter((r) => r.success === false || Boolean(r.error_message && r.error_message.trim() !== "")).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("favorites")}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                    activeFilter === "favorites"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  Favoritas ({recent.filter((r) => r.is_favorite).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("joins")}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                    activeFilter === "joins"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  Com Joins
                </button>
              </div>

              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearOld}
                  disabled={clearingOld}
                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Limpar consultas com mais de 30 dias"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Consultas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && recent.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <RefreshCw className="w-7 h-7 mx-auto animate-spin text-blue-600" />
                <p className="text-sm">A carregar consultas...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Nenhuma consulta encontrada</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    {searchTerm
                      ? "Nenhum resultado corresponde à sua pesquisa."
                      : "Execute consultas no painel para que sejam gravadas no histórico."}
                  </p>
                </div>
              </div>
            ) : (
              filteredList.map((item) => {
                const isCopied = copiedId === item.id;
                const isFav = item.is_favorite;
                const hasPayload = !!item.payload;
                const isFailed =
                  item.success === false ||
                  Boolean(item.error_message && item.error_message.trim() !== "");

                return (
                  <div
                    key={item.id}
                    className={`group border rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-xs space-y-2.5 ${
                      isFailed
                        ? "border-rose-200 bg-rose-50/20 hover:bg-rose-50/30"
                        : "border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/20"
                    }`}
                  >
                    {/* Linha Superior: Badges e Botões de Ação Rápida */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {/* Status de Execução */}
                        {isFailed ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                            title={item.error_message || "Consulta falhou"}
                          >
                            <XCircle size={11} className="text-rose-600" />
                            <span>Falhou</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="Consulta executada com sucesso"
                          >
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Sucesso</span>
                          </span>
                        )}

                        {item.base_table && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md truncate max-w-[140px]">
                            {item.base_table}
                          </span>
                        )}
                        {item.tables_involved && item.tables_involved.length > 1 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded-md">
                            +{item.tables_involved.length - 1} joins
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatRelativeTime(item.executed_at)}
                        </span>
                      </div>

                      {/* Botões do Topo: Favorito & Copiar */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          disabled={togglingFavId === item.id}
                          className={`p-1.5 rounded-md transition-colors ${
                            isFav
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-gray-300 hover:text-amber-400 hover:bg-gray-100"
                          }`}
                          title={isFav ? "Remover dos favoritos" : "Marcar como favorita"}
                        >
                          <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopySQL(item.id, item.query, e)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Copiar consulta SQL"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Bloco de Código SQL Preview */}
                    <div className="relative">
                      <pre className="p-2.5 bg-gray-900 text-blue-300 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-24 selection:bg-blue-600 selection:text-white border border-gray-800">
                        {item.query}
                      </pre>
                    </div>

                    {/* Mensagem de Erro se a consulta falhou */}
                    {isFailed && item.error_message && (
                      <div
                        className="text-[11px] font-mono text-rose-700 bg-rose-50/90 px-2.5 py-1 rounded-lg border border-rose-200 flex items-start gap-1.5"
                        title={item.error_message}
                      >
                        <AlertTriangle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                        <span className="truncate">{item.error_message}</span>
                      </div>
                    )}

                    {/* Linha Inferior: Estatísticas e Ações Principais */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                        {typeof item.duration_ms === "number" && (
                          <span title="Tempo de execução">{item.duration_ms} ms</span>
                        )}
                        {typeof item.row_count === "number" && (
                          <>
                            <span>•</span>
                            <span title="Linhas retornadas">{item.row_count} linhas</span>
                          </>
                        )}
                        {item.count > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-bold">{item.count}x executada</span>
                          </>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!hasPayload}
                          onClick={() => {
                            if (item.payload) {
                              onLoad(item.payload);
                              onClose();
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-lg flex items-center gap-1 transition-colors"
                          title={hasPayload ? "Carregar no Construtor de Consultas" : "Consulta antiga sem payload estruturado"}
                        >
                          <Download className="w-3.5 h-3.5 text-gray-600" />
                          <span className="hidden sm:inline">Carregar</span>
                        </button>

                        <button
                          type="button"
                          disabled={!hasPayload}
                          onClick={() => {
                            if (item.payload) {
                              onRerun(item.payload);
                              onClose();
                            }
                          }}
                          className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                          title={hasPayload ? "Executar esta consulta tal e qual" : "Consulta antiga sem payload estruturado"}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Executar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer do Drawer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono text-[10px] shadow-2xs">Esc</kbd>
              <span>para fechar</span>
            </span>
            <span>
              Mostrando {filteredList.length} de {recent.length}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
