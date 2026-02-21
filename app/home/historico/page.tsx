"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Database,
  Download,
  Search,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { hasPermission } from "@/permissions_val";
import { quickExportToCsv } from "@/app/services/relatorio";

/* =======================
   TYPES & MOCKS
======================= */
interface LogEntry {
  id: string;
  user: string;
  action: string;
  project: string;
  database: string;
  timestamp: string;
  status: "success" | "error" | "warning";
  duration?: number;
  rows_affected?: number;
  query_snippet?: string;
  ip_address?: string;
}

type SortField = "timestamp" | "user" | "action" | "project" | "database" | "duration";
type SortDirection = "asc" | "desc";

export default function HistoricoPage() {
  const { user } = useSession();
  const { t } = useI18n();
  const permissions = user?.permissions ?? [];

  // 🔐 Validação de Permissões
  const canView = hasPermission(permissions, "logs:view");
  const canExport = hasPermission(permissions, "logs:export");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  /* =======================
     FETCH & LOGIC
  ======================= */
  useEffect(() => {
    if (!canView) return;
    handleRefresh();
  }, [canView]);

  const stats = useMemo(() => {
    const total = logs.length;
    if (total === 0) return { total: 0, success: 0, error: 0, warning: 0, avgDuration: 0 };
    return {
      total,
      success: logs.filter((l) => l.status === "success").length,
      error: logs.filter((l) => l.status === "error").length,
      warning: logs.filter((l) => l.status === "warning").length,
      avgDuration: logs.reduce((acc, l) => acc + (l.duration || 0), 0) / total,
    };
  }, [logs]);

  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesSearch = [log.user, log.project, log.database].some((f) =>
          f.toLowerCase().includes(search.toLowerCase())
        );
        const matchesAction = filter === "Todos" || log.action === filter;
        const matchesDate = !date || log.timestamp.startsWith(date);
        const matchesStatus = statusFilter === "all" || log.status === statusFilter;
        return matchesSearch && matchesAction && matchesDate && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: number | string | undefined =
          sortField === "timestamp" ? new Date(a.timestamp).getTime() : a[sortField];
        let bVal: number | string | undefined =
          sortField === "timestamp" ? new Date(b.timestamp).getTime() : b[sortField];

        // Handle possible undefined values for sorting safely
        if (aVal === undefined) aVal = "";
        if (bVal === undefined) bVal = "";

        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
      });
  }, [logs, search, filter, date, statusFilter, sortField, sortDirection]);

  const paginatedLogs = filteredAndSortedLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage) || 1;

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulação MustaInf
    setTimeout(() => {
      setLogs(generateMockLogs());
      setPage(1); // Resetar página ao recarregar
      setIsLoading(false);
    }, 800);
  };

  /* =======================
     GUARDS
  ======================= */
  if (!canView) return <AccessDeniedUI t={t} />;

  return (
    // Fundo Principal do Padrão Oficial
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. HEADER (Estilo Painel de Conexões) */}
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
                className={`p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all shadow-sm ${
                  isLoading ? "animate-spin text-blue-600" : ""
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
          <MiniStat
            label={t("history.statsTotal") || "Total Ops"}
            value={stats.total}
            icon={<BarChart3 size={18} />}
            color="text-blue-600"
          />
          <MiniStat
            label={t("history.statsSuccess") || "Sucesso"}
            value={stats.success}
            icon={<CheckCircle2 size={18} />}
            color="text-green-600"
          />
          <MiniStat
            label={t("history.statsFail") || "Falhas"}
            value={stats.error}
            icon={<XCircle size={18} />}
            color="text-red-600"
          />
          <MiniStat
            label={t("history.statsWarn") || "Avisos"}
            value={stats.warning}
            icon={<AlertCircle size={18} />}
            color="text-amber-500"
          />
          <MiniStat
            label={t("history.statsLatency") || "Latência Avg"}
            value={`${Math.round(stats.avgDuration)}ms`}
            icon={<Clock size={18} />}
            color="text-purple-600"
          />
        </div>

        {/* 3. FILTROS AVANÇADOS */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-center shadow-sm">
          <div className="relative group md:col-span-2">
            <Search
              className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder={t("history.searchPlaceholder") || "Pesquisar usuário, projeto..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
             <option value="Todos">{t('history.allActions') || "Todas as Ações"}</option>
             <option value="SELECT">SELECT</option>
             <option value="UPDATE">UPDATE</option>
             <option value="INSERT">INSERT</option>
             <option value="DELETE">DELETE</option>
             <option value="DROP_TABLE">DROP_TABLE</option>
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

        {/* 4. TABELA DE DADOS E PAGINAÇÃO */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
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
                  <Th field="timestamp" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                    {t("history.colTime") || "Timestamp"}
                  </Th>
                  <Th field="user" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                    {t("history.colUser") || "Identidade"}
                  </Th>
                  <Th field="action" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                    {t("history.colAction") || "Operação"}
                  </Th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("history.colContext") || "Contexto"}
                  </th>
                  <Th field="duration" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>
                    {t("history.colDuration") || "Latência"}
                  </Th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    {t("history.colStatus") || "Status"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-4 font-mono text-xs text-gray-500">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700 uppercase border border-blue-100">
                          {log.user.substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.user}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-900 font-semibold">{log.project}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{log.database}</div>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-600">{log.duration}ms</td>
                    <td className="p-4 text-right">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
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
          
          {/* Controles de Paginação Básicos */}
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
        </div>
      </div>

      {/* 5. MODAL DE DETALHES (OVERLAY) */}
      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} t={t} />}
    </div>
  );
}

/* =======================
   SUB-COMPONENTS (Padrão Oficial)
======================= */

interface MiniStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function MiniStat({ label, value, icon, color }: MiniStatProps) {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`${color}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

interface ThProps {
  children: React.ReactNode;
  field: SortField;
  current: SortField;
  dir: SortDirection;
  onSort: (field: SortField) => void;
  onDir: (dir: SortDirection) => void;
}

function Th({ children, field, current, dir, onSort, onDir }: ThProps) {
  const isActive = current === field;
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
        {isActive &&
          (dir === "asc" ? (
            <ChevronUp size={14} className="text-blue-600" />
          ) : (
            <ChevronDown size={14} className="text-blue-600" />
          ))}
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: "success" | "error" | "warning" }) {
  const styles: Record<"success" | "error" | "warning", string> = {
    success: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
}

interface DetailModalProps {
  log: LogEntry;
  onClose: () => void;
  t: (key: string) => string;
}

function DetailModal({ log, onClose, t }: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            {t("history.modalTitle") || "Registro de Auditoria"}{" "}
            <span className="text-gray-500 font-mono text-xs">[{log.id}]</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <DataField label={t("history.colUser") || "Operador"} value={log.user} />
            <DataField label={t("history.colTime") || "Timestamp"} value={log.timestamp} />
            <DataField label="Status Code" value={log.status.toUpperCase()} />
          </div>
          <div className="space-y-4">
            <DataField label={t("history.colProject") || "Aplicação"} value={log.project} />
            <DataField label="IP Origem" value={log.ip_address || "Internal"} />
            <DataField
              label={t("history.colRows") || "Linhas Afetadas"}
              value={log.rows_affected?.toString() ?? "N/A"}
            />
          </div>

          <div className="col-span-2 mt-2">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              RAW SQL Snippet
            </label>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl font-mono text-sm text-green-400 overflow-x-auto shadow-inner">
              {log.query_snippet || "-- No data available --"}
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

interface DataFieldProps {
  label: string;
  value: string;
}

function DataField({ label, value }: DataFieldProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function AccessDeniedUI({ t }: { t: (key: string) => string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm">
        <ShieldAlert className="text-red-600" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("history.accessDenied") || "Acesso Negado"}
      </h1>
      <p className="text-gray-600 max-w-md text-sm leading-relaxed">
        {t("history.accessDeniedDesc") || "O seu perfil não possui as permissões"}{" "}
        <code className="text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded ml-1 mr-1 font-mono text-xs">
          logs:view
        </code>{" "}
        {t("history.accessDeniedDesc2") || "necessárias para aceder ao rastro de auditoria."}
      </p>
    </div>
  );
}

/* =======================
   HELPERS
======================= */
const getActionStyle = (action: string) => {
  if (action.includes("SELECT")) return "text-blue-700 border-blue-200 bg-blue-50";
  if (action.includes("DELETE") || action.includes("DROP")) return "text-red-700 border-red-200 bg-red-50";
  if (action.includes("UPDATE") || action.includes("INSERT")) return "text-amber-700 border-amber-200 bg-amber-50";
  return "text-purple-700 border-purple-200 bg-purple-50";
};

const generateMockLogs = (): LogEntry[] => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `TX-${1000 + i}`,
    user: ["francemy@musta.io", "admin@system", "dev_core@musta.io"][Math.floor(Math.random() * 3)],
    action: ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP_TABLE"][Math.floor(Math.random() * 5)],
    project: ["MustaInf ERP", "CRM Cloud", "Auth Microservice"][Math.floor(Math.random() * 3)],
    database: "PostgreSQL_Prod_01",
    timestamp: "2024-05-20 14:30:01",
    status: ["success", "success", "error", "warning"][Math.floor(Math.random() * 4)] as "success" | "error" | "warning",
    duration: Math.floor(Math.random() * 1200),
    query_snippet: "SELECT * FROM users WHERE active = true LIMIT 100;",
    ip_address: "192.168.10.122",
  }));
};