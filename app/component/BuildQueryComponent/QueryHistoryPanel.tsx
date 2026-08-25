"use client";
import React, { useCallback, useEffect, useState } from "react";
import { History, Play, Download, Star, RefreshCw, ChevronDown, Sparkles } from "lucide-react";
import { useSession } from "@/context/SessionContext";
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
};

type Props = {
  /** Muda a cada execução para re-buscar o histórico (tempo real). */
  reloadSignal: number;
  /** Corre EXACTAMENTE a consulta guardada (reprodução fiel, inclui joins). */
  onRerun: (payload: QueryPayload) => void;
  /** Carrega a consulta no construtor para editar. */
  onLoad: (payload: QueryPayload) => void;
  /** Clicar numa sugestão de tabela. */
  onPickTable?: (table: string) => void;
};

function shortWhen(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

const QueryHistoryPanel: React.FC<Props> = ({ reloadSignal, onRerun, onLoad, onPickTable }) => {
  const { api, user } = useSession();
  const connId = (user?.info_extra as { id_connection?: number } | undefined)?.id_connection;

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [topTables, setTopTables] = useState<{ table: string; uses: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const fetchRecent = useCallback(async () => {
    if (!connId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/history/recent-queries`, {
        params: { conn_id: connId, limit: 15 },
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
    fetchRecent();
  }, [fetchRecent, reloadSignal]);

  if (!connId) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <History size={16} className="text-blue-600" />
          Histórico &amp; Sugestões
          {recent.length > 0 && (
            <span className="text-[11px] font-semibold text-gray-500">({recent.length})</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              fetchRecent();
            }}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            title="Atualizar"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
        </span>
      </button>

      {open && (
        <div className="p-3 space-y-3">
          {/* Sugestões: tabelas mais usadas */}
          {topTables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Sparkles size={12} /> Sugestões
              </span>
              {topTables.map((s) => (
                <button
                  key={s.table}
                  type="button"
                  onClick={() => onPickTable?.(s.table)}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                  title={`${s.uses} utilização(ões)`}
                >
                  {s.table} · {s.uses}
                </button>
              ))}
            </div>
          )}

          {/* Consultas recentes */}
          {recent.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">
              Ainda sem consultas. Execute uma para aparecer aqui.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {recent.map((it) => (
                <div
                  key={it.id}
                  className="group flex items-start gap-2 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {it.is_favorite && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                      <code className="text-[11px] text-gray-700 truncate block" title={it.query}>
                        {it.query}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span>{shortWhen(it.executed_at)}</span>
                      {typeof it.row_count === "number" && <span>· {it.row_count} linhas</span>}
                      {it.count > 1 && <span>· {it.count}×</span>}
                      {(it.tables_involved?.length ?? 0) > 0 && (
                        <span className="truncate">· {it.tables_involved!.join(", ")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!it.payload}
                      onClick={() => it.payload && onRerun(it.payload)}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={it.payload ? "Correr novamente" : "Sem dados estruturados (consulta antiga)"}
                    >
                      <Play size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={!it.payload}
                      onClick={() => it.payload && onLoad(it.payload)}
                      className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={it.payload ? "Carregar no construtor" : "Sem dados estruturados"}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryHistoryPanel;
