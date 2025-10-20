"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Database,
  User,
  Calendar,
  Download,
  Search,
  RefreshCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  MoreVertical,
  BarChart3,
} from "lucide-react";
import usePersistedState from "@/hook/localStoreUse";
import { themeClassesMap } from "@/constant";
import { quickExportToCsv } from "@/app/services/relatorio";

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
  const [isDarkMode, setIsDarkMode] = usePersistedState<boolean>("_theme", true);
  const currentTheme = isDarkMode ? "dark" : "light";
  const themeClasses = themeClassesMap[currentTheme];

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
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
    warning: 0,
    avgDuration: 0,
  });

  // Simulação de logs mais realista
  useEffect(() => {
    const generateFakeLogs = (): LogEntry[] => {
      const actions = ["SELECT", "INSERT", "INSERT_AUTO", "UPDATE", "DELETE", "CREATE_TABLE", "ALTER_TABLE", "DROP_TABLE"];
      const projects = ["ERP Financeiro", "Gestor RH", "CRM Vendas", "E-commerce", "Analytics Platform", "Mobile App"];
      const databases = ["PostgreSQL", "MySQL", "SQL Server", "MongoDB", "Redis", "SQLite"];
      const users = ["francemy@empresa.com", "ana@empresa.com", "mario@empresa.com", "carlos@empresa.com", "maria@empresa.com"];
      const statuses: ("success" | "error" | "warning")[] = ["success", "success", "success", "error", "warning"];

      return Array.from({ length: 150 }, (_, i) => {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: `log-${i + 1}`,
          user: users[Math.floor(Math.random() * users.length)],
          action,
          project: projects[Math.floor(Math.random() * projects.length)],
          database: databases[Math.floor(Math.random() * databases.length)],
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
          status,
          duration: Math.floor(Math.random() * 5000),
          rows_affected: action === "SELECT" ? undefined : Math.floor(Math.random() * 1000),
          query_snippet: `${action} FROM ${Math.random() > 0.5 ? 'users' : 'products'}${Math.random() > 0.7 ? ' WHERE...' : ''}`,
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        };
      });
    };

    setLogs(generateFakeLogs());
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (logs.length > 0) {
      const successCount = logs.filter(log => log.status === "success").length;
      const errorCount = logs.filter(log => log.status === "error").length;
      const warningCount = logs.filter(log => log.status === "warning").length;
      const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
      
      setStats({
        total: logs.length,
        success: successCount,
        error: errorCount,
        warning: warningCount,
        avgDuration: totalDuration / logs.length,
      });
    }
  }, [logs]);

  // Filtro e ordenação
  const filteredAndSortedLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.project.toLowerCase().includes(search.toLowerCase()) ||
        log.database.toLowerCase().includes(search.toLowerCase());
      const matchesAction = filter === "Todos" ? true : log.action === filter;
      const matchesDate = date ? log.timestamp.startsWith(date) : true;
      const matchesStatus = statusFilter === "all" ? true : log.status === statusFilter;

      return matchesSearch && matchesAction && matchesDate && matchesStatus;
    });

    // Ordenação
    filtered.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aValue: any = a[sortField];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bValue: any = b[sortField];

      if (sortField === "timestamp") {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [logs, search, filter, date, statusFilter, sortField, sortDirection]);

  // Paginação
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLogs, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleExport = () => {
    quickExportToCsv(filteredAndSortedLogs, `historico_logs_${new Date().toISOString().split('T')[0]}`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Aqui você faria o fetch real da API
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("SELECT")) return "text-blue-400 bg-blue-400/10";
    if (action.startsWith("INSERT")) return "text-green-400 bg-green-400/10";
    if (action.startsWith("UPDATE")) return "text-yellow-400 bg-yellow-400/10";
    if (action.startsWith("DELETE") || action.startsWith("DROP")) return "text-red-400 bg-red-400/10";
    return "text-purple-400 bg-purple-400/10";
  };

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 lg:p-6 text-white">
      <div className={`max-w-7xl mx-auto p-6 lg:p-8 rounded-2xl shadow-xl ${themeClasses.container}`}>
        {/* 🔹 Cabeçalho */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <FileText className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Histórico de Atividades</h1>
              <p className="text-white/70 text-sm">Monitoramento completo das operações no banco de dados</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${themeClasses.button}`}
            >
              {isDarkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
            </button>
          </div>
        </div>

        {/* 📊 Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${themeClasses.card} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-lg font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-white/70">Total</p>
          </div>
          <div className={`p-4 rounded-xl ${themeClasses.card} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-lg font-bold">{stats.success}</span>
            </div>
            <p className="text-sm text-white/70">Sucesso</p>
          </div>
          <div className={`p-4 rounded-xl ${themeClasses.card} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-lg font-bold">{stats.error}</span>
            </div>
            <p className="text-sm text-white/70">Erros</p>
          </div>
          <div className={`p-4 rounded-xl ${themeClasses.card} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold">{stats.warning}</span>
            </div>
            <p className="text-sm text-white/70">Alertas</p>
          </div>
          <div className={`p-4 rounded-xl ${themeClasses.card} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Play className="w-5 h-5 text-purple-400" />
              <span className="text-lg font-bold">{Math.round(stats.avgDuration)}ms</span>
            </div>
            <p className="text-sm text-white/70">Duração Média</p>
          </div>
        </div>

        {/* 🔍 Filtros Avançados */}
        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 rounded-xl mb-6 ${themeClasses.card}`}>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3">
            <Search className="w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Buscar por usuário, projeto ou base..."
              className="bg-transparent outline-none p-2 w-full text-white placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="p-2 rounded-lg bg-white/10 text-white border-none outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Todos">Todas as Ações</option>
            <option value="SELECT">SELECT</option>
            <option value="INSERT">INSERT</option>
            <option value="INSERT_AUTO">INSERT AUTO</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CREATE_TABLE">CREATE TABLE</option>
            <option value="ALTER_TABLE">ALTER TABLE</option>
            <option value="DROP_TABLE">DROP TABLE</option>
          </select>

          <select
            className="p-2 rounded-lg bg-white/10 text-white border-none outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="warning">Alerta</option>
          </select>

          <input
            type="date"
            className="p-2 rounded-lg bg-white/10 text-white border-none outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg flex-1 ${themeClasses.button} disabled:opacity-50`}
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Atualizando..." : "Atualizar"}
            </button>
            
            <button
              onClick={handleExport}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg ${themeClasses.button}`}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* 📊 Tabela */}
        <div className="overflow-x-auto rounded-xl shadow-lg">
          <table className="w-full text-sm">
            <thead className="bg-white/20">
              <tr>
                <SortableHeader field="timestamp">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data/Hora
                </SortableHeader>
                <SortableHeader field="user">
                  <User className="w-4 h-4 inline mr-1" />
                  Usuário
                </SortableHeader>
                <SortableHeader field="action">
                  <Database className="w-4 h-4 inline mr-1" />
                  Ação
                </SortableHeader>
                <SortableHeader field="project">Projeto</SortableHeader>
                <SortableHeader field="database">Base de Dados</SortableHeader>
                <SortableHeader field="duration">Duração</SortableHeader>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/10 border-b border-white/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span className="truncate max-w-[120px] lg:max-w-[150px]" title={log.user}>
                          {log.user}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="truncate max-w-[100px] lg:max-w-[150px]" title={log.project}>
                        {log.project}
                      </span>
                    </td>
                    <td className="p-3">{log.database}</td>
                    <td className="p-3">
                      {log.duration ? (
                        <div className="flex items-center gap-1">
                          <Play size={12} />
                          {log.duration}ms
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`capitalize ${
                          log.status === "success" ? "text-green-400" :
                          log.status === "error" ? "text-red-400" : "text-yellow-400"
                        }`}>
                          {log.status === "success" ? "Sucesso" : log.status === "error" ? "Erro" : "Alerta"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-white/70 italic">
                    Nenhum registro encontrado com os filtros atuais
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 Paginação */}
        {totalPages > 1 && (
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                Exibindo {paginatedLogs.length} de {filteredAndSortedLogs.length} registros
              </span>
              
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="p-1 rounded bg-white/10 text-white border-none outline-none text-sm"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                <ChevronUp className="w-4 h-4 transform -rotate-90" />
              </button>
              
              <span className="px-3 py-1 bg-white/10 rounded-lg text-sm">
                Página {page} de {totalPages}
              </span>
              
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                <ChevronUp className="w-4 h-4 transform rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* 🔍 Modal de Detalhes */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-2xl w-full rounded-2xl p-6 ${themeClasses.container}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Detalhes da Operação</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Usuário</label>
                    <p className="font-medium">{selectedLog.user}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Data/Hora</label>
                    <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Ação</label>
                    <p className={`font-medium ${getActionColor(selectedLog.action).split(' ')[0]}`}>
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedLog.status)}
                      <span className="font-medium capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-white/70">Projeto</label>
                  <p className="font-medium">{selectedLog.project}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70">Base de Dados</label>
                    <p className="font-medium">{selectedLog.database}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Duração</label>
                    <p className="font-medium">{selectedLog.duration ? `${selectedLog.duration}ms` : "N/A"}</p>
                  </div>
                </div>
                
                {selectedLog.query_snippet && (
                  <div>
                    <label className="text-sm text-white/70">Query</label>
                    <div className="bg-white/10 p-3 rounded-lg font-mono text-sm">
                      {selectedLog.query_snippet}
                    </div>
                  </div>
                )}
                
                {selectedLog.rows_affected !== undefined && (
                  <div>
                    <label className="text-sm text-white/70">Linhas Afetadas</label>
                    <p className="font-medium">{selectedLog.rows_affected}</p>
                  </div>
                )}
                
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-sm text-white/70">Endereço IP</label>
                    <p className="font-medium">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}