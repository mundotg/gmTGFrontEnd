"use client";
import React from "react";
import {
  Database,
  Sun,
  Moon,
  RefreshCw,
  Grid,
  Eye,
  Code,
  Zap,
  Activity,
  Key,
  Server,
  Settings,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DatabaseBackup,
  ArrowLeftRight,
  Loader2,
  Plus,
  Trash2,
  MousePointerClick,
  X,
} from "lucide-react";
import { StatCard } from "./statCard";
import { Usuario } from "@/context/SessionContext";
import { TableInfo } from "@/types";
import { FilterPanel } from "./FilterPanel";

export interface HealthStatus {
  status: "healthy" | "error" | string;
}

interface Metadata {
  server_version?: string;
  table_count?: number;
  view_count?: number;
  procedure_count?: number;
  function_count?: number;
  trigger_count?: number;
  index_count?: number;
  database_name?: string;
}

interface DatabaseHeaderProps {
  cardClasses?: string;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  healthStatus?: HealthStatus | null;
  metadata?: Metadata | null;
  user?: Usuario | null;
  handleRefresh: () => void;
  isLoading: boolean;
  selectAllVisible: () => void;
  clearSelection: () => void;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteSelectedTables: () => void;
  setIsTransactionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBackupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeadlocksOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filteredAndSortedTables: TableInfo[];

  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filterSchema: string;
  setFilterSchema: React.Dispatch<React.SetStateAction<string>>;
  sortBy: "name" | "rows" | "schema";
  setSortBy: React.Dispatch<React.SetStateAction<"name" | "rows" | "schema">>;
  viewMode: "grid" | "list";
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  schemas: string[];
}

const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({
  cardClasses = "",
  isDarkMode,
  setIsDarkMode,
  healthStatus,
  metadata,
  user,
  handleRefresh,
  isLoading,
  selectAllVisible,
  clearSelection,
  setIsCreateOpen,
  handleDeleteSelectedTables,
  setIsTransactionOpen,
  setIsBackupOpen,
  setIsDeadlocksOpen,
  filteredAndSortedTables,
  searchTerm,
  setSearchTerm,
  filterSchema,
  setFilterSchema,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  schemas
}) => {

  const StatusBadge = ({ status, label }: { status: 'healthy' | 'warning' | 'error', label: string }) => {
    const styles = {
      healthy: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10',
      warning: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10',
      error: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
    };

    const icons = {
      healthy: <CheckCircle2 className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-xl ${styles[status]} transition-all duration-300 hover:scale-105`}>
        {icons[status]}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className={`${cardClasses} border-b top-0 z-50 backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Principal */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
              <Database className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                Database Explorer
              </h1>
              <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                {metadata?.server_version || "Gerenciamento Avançado de Banco de Dados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {healthStatus && (
              <StatusBadge
                status={healthStatus.status === "healthy" ? "healthy" : "error"}
                label={healthStatus.status === "healthy" ? "Conectado" : "Erro"}
              />
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-yellow-400 shadow-lg shadow-yellow-500/10"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-lg"
              }`}
              title="Alternar tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 shadow-lg shadow-blue-500/10"
                  : "bg-slate-200 hover:bg-slate-300 shadow-lg"
              }`}
              title="Atualizar dados"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Grid} label="Tabelas" value={metadata?.table_count || 0} colorClass="text-blue-500" isDarkMode={isDarkMode} />
          <StatCard icon={Eye} label="Views" value={metadata?.view_count || 0} colorClass="text-green-500" isDarkMode={isDarkMode} />
          <StatCard icon={Code} label="Procedures" value={metadata?.procedure_count || 0} colorClass="text-purple-500" isDarkMode={isDarkMode} />
          <StatCard icon={Zap} label="Functions" value={metadata?.function_count || 0} colorClass="text-orange-500" isDarkMode={isDarkMode} />
          <StatCard icon={Activity} label="Triggers" value={metadata?.trigger_count || 0} colorClass="text-red-500" isDarkMode={isDarkMode} />
          <StatCard icon={Key} label="Indexes" value={metadata?.index_count || 0} colorClass="text-cyan-500" isDarkMode={isDarkMode} />
        </div>

        {/* Informações do Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard icon={Server} title="Servidor" value={metadata?.database_name || "N/A"} color="from-blue-500 to-cyan-500" isDarkMode={isDarkMode} />
          <InfoCard icon={Database} title="Banco de Dados" value={metadata?.database_name || "N/A"} color="from-green-500 to-emerald-500" isDarkMode={isDarkMode} />
          <InfoCard icon={Settings} title="Tipo" value={user?.info_extra?.type || "N/A"} color="from-purple-500 to-pink-500" isDarkMode={isDarkMode} />
        </div>

        {/* Painel de Filtros */}
        <FilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSchema={filterSchema}
          setFilterSchema={setFilterSchema}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          schemas={schemas}
          isDarkMode={isDarkMode}
        />

        {/* Barra de Ações */}
        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <ActionButton
              onClick={selectAllVisible}
              icon={MousePointerClick}
              label="Selecionar todos"
              variant="primary"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={clearSelection}
              icon={X}
              label="Limpar seleção"
              variant="secondary"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={() => setIsCreateOpen(true)}
              icon={Plus}
              label="Nova tabela"
              variant="success"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={handleDeleteSelectedTables}
              icon={Trash2}
              label="Eliminar selecionadas"
              variant="danger"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={() => setIsTransactionOpen(true)}
              icon={ArrowLeftRight}
              label="Transação"
              variant="purple"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={() => setIsBackupOpen(true)}
              icon={DatabaseBackup}
              label="Backup/Restore"
              variant="orange"
              isDarkMode={isDarkMode}
            />
            <ActionButton
              onClick={() => setIsDeadlocksOpen(true)}
              icon={Activity}
              label="Deadlocks"
              variant="red"
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-4 py-2 rounded-lg ${
              isDarkMode ? "bg-slate-800/50" : "bg-slate-100"
            }`}>
              {filteredAndSortedTables.length} {filteredAndSortedTables.length === 1 ? "tabela" : "tabelas"}
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Atualizando...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseHeader;

// Action Button Component
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'purple' | 'orange' | 'red';
  isDarkMode: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon: Icon, label, variant, isDarkMode }) => {
  const variants = {
    primary: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-blue-500/30',
    secondary: isDarkMode ? 'from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200' : 'from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-700',
    success: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30',
    danger: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-red-500/30',
    purple: 'from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-purple-500/30',
    orange: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30',
    red: 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-red-500/30',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl bg-gradient-to-r ${variants[variant]} flex items-center gap-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

// Info Card Component
interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
  isDarkMode: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, value, color, isDarkMode }) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
      isDarkMode 
        ? "bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl" 
        : "bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg"
    }`}
  >
    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
        {title}
      </p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  </div>
);