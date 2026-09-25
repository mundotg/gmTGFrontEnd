import React, { memo, useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  ShieldAlert,
  XCircle,
  Copy,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import { QueryHistory } from "../types";

// Cliente mínimo (axios) — evita `any` e importações extra.
type ApiClient = {
  get: (url: string) => Promise<{ data: unknown }>;
  post: (url: string) => Promise<{ data: unknown }>;
};

/* =======================
   TYPES
======================= */

export type SortField =
  | "executed_at"
  | "executed_by"
  | "query_type"
  | "app_source"
  | "db_connection_id"
  | "duration_ms";

export type SortDirection = "asc" | "desc";

/* =======================
   HELPERS (OTIMIZADOS)
======================= */

// 🔥 mais rápido (early return + menos checks)
export const getLogStatus = (
  log: QueryHistory | null
): "success" | "error" | "warning" => {
  if (!log) return "success";
  if (log.error_message) return "error";
  if ((log.duration_ms ?? 0) > 1000) return "warning";
  return "success";
};

// 🔥 evita recalcular toUpperCase várias vezes
export const getActionStyle = (action?: string) => {
  if (!action) return "text-purple-700 border-purple-200 bg-purple-50";

  const act = action.toUpperCase();

  if (act.includes("SELECT"))
    return "text-blue-700 border-blue-200 bg-blue-50";

  if (act.includes("DELETE") || act.includes("DROP"))
    return "text-red-700 border-red-200 bg-red-50";

  if (act.includes("UPDATE") || act.includes("INSERT") || act.includes("ALTER"))
    return "text-amber-700 border-amber-200 bg-amber-50";

  return "text-purple-700 border-purple-200 bg-purple-50";
};

/* =======================
   SUB-COMPONENTS
======================= */

interface MiniStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

// 🔥 memo evita re-render desnecessário
export const MiniStat = memo(
  ({ label, value, icon, color }: MiniStatProps) => (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        <span className={color}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
);

MiniStat.displayName = "MiniStat";

interface ThProps {
  children: React.ReactNode;
  field: SortField;
  current: SortField;
  dir: SortDirection;
  onSort: (field: SortField) => void;
  onDir: (dir: SortDirection) => void;
}

// 🔥 memo aqui faz MUITA diferença (tabela grande)
export const Th = memo(
  ({ children, field, current, dir, onSort, onDir }: ThProps) => {
    const isActive = current === field;

    const icon = useMemo(() => {
      if (!isActive) return null;
      return dir === "asc" ? (
        <ChevronUp size={14} className="text-blue-600" />
      ) : (
        <ChevronDown size={14} className="text-blue-600" />
      );
    }, [isActive, dir]);

    return (
      <th
        className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => {
          if (isActive) onDir(dir === "asc" ? "desc" : "asc");
          else onSort(field);
        }}
      >
        <div className="flex items-center gap-1.5">
          {children}
          {icon}
        </div>
      </th>
    );
  }
);

Th.displayName = "Th";

export const StatusBadge = memo(
  ({ status }: { status: "success" | "error" | "warning" }) => {
    const styles = {
      success: "bg-green-50 text-green-700 border-green-200",
      error: "bg-red-50 text-red-700 border-red-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status]}`}
      >
        {status}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

/* =======================
   MODAL
======================= */

interface DetailModalProps {
  log: QueryHistory;
  onClose: () => void;
  t: (key: string) => string;
  api: ApiClient;
  onFavorite?: (id: number, fav: boolean) => void;
}

// Extrai o nº de linhas de várias chaves possíveis do meta_info.
function extractRows(meta?: QueryHistory["meta_info"]): string {
  if (!meta) return "N/A";
  const m = meta as Record<string, unknown>;
  const v = m.row_count ?? m.rows_affected ?? m.total_inseridos ?? m.total_deletados;
  return v != null ? String(v) : "N/A";
}

export const DetailModal = memo(
  ({ log, onClose, t, api, onFavorite }: DetailModalProps) => {
    // Começa com o resumo (da lista) e enriquece com o detalhe completo.
    const [detail, setDetail] = useState<QueryHistory>(log);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [savingFav, setSavingFav] = useState(false);

    useEffect(() => {
      let active = true;
      setLoading(true);
      // A lista só traz o resumo; o SQL/meta/preview vêm do detalhe.
      api
        .get(`/history/${log.id}`)
        .then((res) => {
          if (active && res.data && typeof res.data === "object") {
            setDetail((d) => ({ ...d, ...(res.data as Partial<QueryHistory>) }));
          }
        })
        .catch(() => { /* mantém o resumo */ })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [log, api]);

    const status = useMemo(() => getLogStatus(detail), [detail]);

    const copySql = async () => {
      try {
        await navigator.clipboard.writeText(detail.query || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    };

    const toggleFavorite = async () => {
      setSavingFav(true);
      try {
        const res = await api.post(`/history/${log.id}/favorite`);
        const data = (res.data ?? {}) as Partial<QueryHistory>;
        const fav = data.is_favorite ?? !detail.is_favorite;
        setDetail((d) => ({ ...d, is_favorite: fav }));
        onFavorite?.(log.id, fav);
      } catch { /* ignore */ } finally {
        setSavingFav(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              {t("history.modalTitle") || "Registro de Auditoria"}{" "}
              <span className="text-gray-500 font-mono text-xs">[{log.id}]</span>
              {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFavorite}
                disabled={savingFav}
                title={detail.is_favorite ? "Remover dos favoritos" : "Marcar como favorito"}
                className={`p-1.5 rounded-md transition-colors ${detail.is_favorite ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <Star size={18} className={detail.is_favorite ? "fill-amber-400" : ""} />
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6 overflow-y-auto">
            <div className="space-y-4">
              <DataField label={t("history.colUser") || "Operador"} value={detail.executed_by || "System"} />
              <DataField label={t("history.colTime") || "Timestamp"} value={new Date(detail.executed_at).toLocaleString()} />
              <DataField label="Status" value={status.toUpperCase()} />
              <DataField label="Tipo" value={detail.query_type || "OTHER"} />
            </div>

            <div className="space-y-4">
              <DataField label={t("history.colProject") || "Aplicação"} value={detail.app_source || "N/A"} />
              <DataField label="IP Origem" value={detail.client_ip || "Interno"} />
              <DataField label={t("history.colRows") || "Linhas"} value={extractRows(detail.meta_info)} />
              <DataField label="Duração" value={`${detail.duration_ms ?? 0} ms`} />
            </div>

            {detail.tags && (
              <div className="col-span-2 -mt-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                  {detail.tags}
                </span>
              </div>
            )}

            {detail.error_message && (
              <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-mono break-all">
                {detail.error_message}
              </div>
            )}

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Query / SQL</label>
                <button
                  onClick={copySql}
                  disabled={!detail.query}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 disabled:opacity-40"
                >
                  {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto shadow-inner max-h-48 whitespace-pre-wrap break-all">
                {detail.query || (loading ? "-- a carregar…" : "-- sem dados --")}
              </div>
            </div>

            {detail.result_preview && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Pré-visualização do resultado</label>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono text-[11px] text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                  {detail.result_preview}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t("actions.close") || "Fechar"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DetailModal.displayName = "DetailModal";

/* =======================
   SMALL COMPONENTS
======================= */

export const DataField = memo(
  ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
);

DataField.displayName = "DataField";

export const AccessDeniedUI = memo(
  ({ t }: { t: (key: string) => string }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm">
        <ShieldAlert className="text-red-600" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("history.accessDenied") || "Acesso Negado"}
      </h1>
      <p className="text-gray-600 max-w-md text-sm leading-relaxed">
        {t("history.accessDeniedDesc") ||
          "O seu perfil não possui as permissões"}
        <code className="text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded ml-1 mr-1 font-mono text-xs">
          logs:view
        </code>
        {t("history.accessDeniedDesc2") ||
          "necessárias para aceder ao rastro de auditoria."}
      </p>
    </div>
  )
);

AccessDeniedUI.displayName = "AccessDeniedUI";