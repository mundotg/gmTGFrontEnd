import React, { memo, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { QueryHistory } from "../types";

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
}

export const DetailModal = memo(
  ({ log, onClose, t }: DetailModalProps) => {
    const status = useMemo(() => getLogStatus(log), [log]);

    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              {t("history.modalTitle") || "Registro de Auditoria"}{" "}
              <span className="text-gray-500 font-mono text-xs">
                [{log.id}]
              </span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <DataField
                label={t("history.colUser") || "Operador"}
                value={log.executed_by || "System"}
              />
              <DataField
                label={t("history.colTime") || "Timestamp"}
                value={new Date(log.executed_at).toLocaleString()}
              />
              <DataField label="Status Code" value={status.toUpperCase()} />

              {log.error_message && (
                <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-mono break-all">
                  {log.error_message}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <DataField
                label={t("history.colProject") || "Aplicação"}
                value={log.app_source || "N/A"}
              />
              <DataField
                label="IP Origem"
                value={log.client_ip || "Internal"}
              />
              <DataField
                label={t("history.colRows") || "Linhas Afetadas"}
                value={
                  log.meta_info?.rows_affected?.toString() ?? "N/A"
                }
              />
            </div>

            <div className="col-span-2 mt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                RAW SQL Snippet
              </label>
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto shadow-inner max-h-48">
                {log.query || "-- No data available --"}
              </div>
            </div>
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