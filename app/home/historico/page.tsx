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
  ShieldAlert
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
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
      success: logs.filter(l => l.status === "success").length,
      error: logs.filter(l => l.status === "error").length,
      warning: logs.filter(l => l.status === "warning").length,
      avgDuration: logs.reduce((acc, l) => acc + (l.duration || 0), 0) / total
    };
  }, [logs]);

  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = [log.user, log.project, log.database].some(f => f.toLowerCase().includes(search.toLowerCase()));
        const matchesAction = filter === "Todos" || log.action === filter;
        const matchesDate = !date || log.timestamp.startsWith(date);
        const matchesStatus = statusFilter === "all" || log.status === statusFilter;
        return matchesSearch && matchesAction && matchesDate && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: any = sortField === "timestamp" ? new Date(a.timestamp).getTime() : a[sortField];
        let bVal: any = sortField === "timestamp" ? new Date(b.timestamp).getTime() : b[sortField];
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [logs, search, filter, date, statusFilter, sortField, sortDirection]);

  const paginatedLogs = filteredAndSortedLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulação MustaInf
    setTimeout(() => {
      setLogs(generateMockLogs()); 
      setIsLoading(false);
    }, 800);
  };

  /* =======================
     GUARDS
  ======================= */
  if (!canView) return <AccessDeniedUI />;

  return (
    <div className="min-h-screen ] p-6 space-y-8 font-sans selection:bg-blue-500/30">
      
      {/* 1. HEADER INDUSTRIAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="h-1 w-10 bg-amber-500 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Security Audit Log</span>
          </div>
          <h1 className="text-3xl font-bold  tracking-tighter flex items-center gap-3">
            <Terminal className="text-amber-500" size={28} />
            Histórico de Atividades
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <button 
              onClick={() => quickExportToCsv(filteredAndSortedLogs, "audit_log")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[11px] font-black rounded-lg hover:bg-slate-200 transition-all uppercase tracking-tighter"
            >
              <Download size={14} /> Exportar CSV
            </button>
          )}
          <button 
            onClick={handleRefresh}
            className={`p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* 2. ESTATÍSTICAS GRAY-30 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MiniStat label="Total Ops" value={stats.total} icon={<BarChart3 size={16}/>} />
        <MiniStat label="Sucesso" value={stats.success} icon={<CheckCircle2 size={16} className="text-emerald-500"/>} />
        <MiniStat label="Falhas" value={stats.error} icon={<XCircle size={16} className="text-red-500"/>} />
        <MiniStat label="Avisos" value={stats.warning} icon={<AlertCircle size={16} className="text-amber-500"/>} />
        <MiniStat label="Latência Avg" value={`${Math.round(stats.avgDuration)}ms`} icon={<Clock size={16} className="text-blue-500"/>} />
      </div>

      {/* 3. FILTROS AVANÇADOS */}
      <div className="border border-white/5 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center shadow-2xl">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            placeholder="Pesquisar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-white/[0.03] border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
        <input 
          type="date"
          className="bg-white/[0.03] border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <div className="text-[10px] font-bold text-slate-500 text-right uppercase tracking-widest">
          {filteredAndSortedLogs.length} Entradas encontradas
        </div>
      </div>

      {/* 4. TABELA DE DADOS */}
      <div className="border border-white/5 rounded-2xl overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <Th field="timestamp" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>Timestamp</Th>
              <Th field="user" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>Identidade</Th>
              <Th field="action" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>Operação</Th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Contexto</th>
              <Th field="duration" current={sortField} dir={sortDirection} onSort={setSortField} onDir={setSortDirection}>Latência</Th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {paginatedLogs.map((log) => (
              <tr 
                key={log.id} 
                className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => setSelectedLog(log)}
              >
                <td className="p-4 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-white/10 uppercase">
                      {log.user.substring(0,2)}
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{log.user}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getActionStyle(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{log.project}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{log.database}</div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-400">{log.duration}ms</td>
                <td className="p-4 text-right">
                  <StatusBadge status={log.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. MODAL DE DETALHES (OVERLAY) */}
      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

    </div>
  );
}

/* =======================
   SUB-COMPONENTS (GRAY-30)
======================= */

function MiniStat({ label, value, icon }: any) {
  return (
    <div className="border border-white/5 p-4 rounded-xl group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div className="text-xl font-bold text-white tracking-tighter">{value}</div>
    </div>
  );
}

function Th({ children, field, current, dir, onSort, onDir }: any) {
  const isActive = current === field;
  return (
    <th 
      className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest cursor-pointer hover:text-white transition-colors"
      onClick={() => {
        if (isActive) onDir(dir === "asc" ? "desc" : "asc");
        else onSort(field);
      }}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (dir === "asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
}

function DetailModal({ log, onClose }: { log: LogEntry, onClose: () => void }) {
  return (
    <div className="fixed inset-0  backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            Audit_Internal_Record <span className="text-slate-500 font-mono text-xs">[{log.id}]</span>
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle size={20}/></button>
        </div>
        <div className="p-8 grid grid-cols-2 gap-8">
           <div className="space-y-4">
              <DataField label="Operador" value={log.user} />
              <DataField label="Timestamp" value={log.timestamp} />
              <DataField label="Status Code" value={log.status.toUpperCase()} />
           </div>
           <div className="space-y-4">
              <DataField label="Aplicação" value={log.project} />
              <DataField label="IP Origem" value={log.ip_address || "Internal"} />
              <DataField label="Linhas Afetadas" value={log.rows_affected ?? "N/A"} />
           </div>
           <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block">RAW SQL Snippet</label>
              <div className="bg-black border border-white/5 p-4 rounded-xl font-mono text-xs text-blue-300 overflow-x-auto">
                {log.query_snippet || "-- No data available --"}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value }: any) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function AccessDeniedUI() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#050505] text-center p-6">
       <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert className="text-red-500" size={40} />
       </div>
       <h1 className="text-2xl font-bold text-white mb-2 tracking-tighter">Acesso Negado</h1>
       <p className="text-slate-500 max-w-md text-sm">
         O seu perfil não possui as permissões <code className="text-red-400 bg-red-400/10 px-1 rounded">logs:view</code> necessárias para aceder ao rastro de auditoria.
       </p>
    </div>
  );
}

/* =======================
   HELPERS
======================= */
const getActionStyle = (action: string) => {
  if (action.includes("SELECT")) return "text-blue-400 border-blue-400/20 bg-blue-400/5";
  if (action.includes("DELETE") || action.includes("DROP")) return "text-red-400 border-red-400/20 bg-red-400/5";
  if (action.includes("UPDATE") || action.includes("INSERT")) return "text-amber-400 border-amber-400/20 bg-amber-400/5";
  return "text-purple-400 border-purple-400/20 bg-purple-400/5";
};

const generateMockLogs = (): LogEntry[] => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `TX-${1000 + i}`,
    user: ["francemy@musta.io", "admin@system", "dev_core@musta.io"][Math.floor(Math.random() * 3)],
    action: ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP_TABLE"][Math.floor(Math.random() * 5)],
    project: ["MustaInf ERP", "CRM Cloud", "Auth Microservice"][Math.floor(Math.random() * 3)],
    database: "PostgreSQL_Prod_01",
    timestamp: "2024-05-20 14:30:01",
    status: ["success", "success", "error", "warning"][Math.floor(Math.random() * 4)] as any,
    duration: Math.floor(Math.random() * 1200),
    query_snippet: "SELECT * FROM users WHERE active = true LIMIT 100;",
    ip_address: "192.168.10.122"
  }));
};