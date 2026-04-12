"use client";
import React from "react";
import { useI18n } from "@/context/I18nContext";
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
import { TableInfo, Usuario } from "@/types";
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
  // cardClasses = "",
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
  const { t } = useI18n(); // <-- Hook de tradução adicionado

  const StatusBadge = ({ status, label }: { status: 'healthy' | 'warning' | 'error', label: string }) => {
    const styles = {
      healthy: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      error: 'bg-red-50 text-red-700 border-red-200'
    };

    const icons = {
      healthy: <CheckCircle2 className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {icons[status]}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className={`border-b ${isDarkMode ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-200'} pb-6`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('database.explorer') || "Database Explorer"}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {metadata?.server_version || t('database.advancedManagement') || "Gerenciamento Avançado de Banco de Dados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {healthStatus && (
              <StatusBadge
                status={healthStatus.status === "healthy" ? "healthy" : "error"}
                label={healthStatus.status === "healthy" ? (t('status.connected') || "Conectado") : (t('status.error') || "Erro")}
              />
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-colors ${isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              title={t('actions.toggleTheme') || "Alternar tema"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              title={t('actions.refresh') || "Atualizar dados"}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Grid de Estatísticas Pequenas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Grid} label={t('stats.tables') || "Tabelas"} value={metadata?.table_count || 0} colorClass="text-blue-600" isDarkMode={isDarkMode} />
          <StatCard icon={Eye} label={t('stats.views') || "Views"} value={metadata?.view_count || 0} colorClass="text-green-600" isDarkMode={isDarkMode} />
          <StatCard icon={Code} label={t('stats.procedures') || "Procedures"} value={metadata?.procedure_count || 0} colorClass="text-purple-600" isDarkMode={isDarkMode} />
          <StatCard icon={Zap} label={t('stats.functions') || "Functions"} value={metadata?.function_count || 0} colorClass="text-orange-600" isDarkMode={isDarkMode} />
          <StatCard icon={Activity} label={t('stats.triggers') || "Triggers"} value={metadata?.trigger_count || 0} colorClass="text-red-600" isDarkMode={isDarkMode} />
          <StatCard icon={Key} label={t('stats.indexes') || "Indexes"} value={metadata?.index_count || 0} colorClass="text-cyan-600" isDarkMode={isDarkMode} />
        </div>

        {/* Informações do Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard icon={Server} title={t('connection.host') || "Servidor"} value={metadata?.database_name || "N/A"} iconColor="text-blue-600" bgColor="bg-blue-50" isDarkMode={isDarkMode} />
          <InfoCard icon={Database} title={t('connection.database') || "Banco de Dados"} value={metadata?.database_name || "N/A"} iconColor="text-green-600" bgColor="bg-green-50" isDarkMode={isDarkMode} />
          <InfoCard icon={Settings} title={t('connection.type') || "Tipo"} value={user?.info_extra?.type || "N/A"} iconColor="text-purple-600" bgColor="bg-purple-50" isDarkMode={isDarkMode} />
        </div>

        {/* Painel de Filtros (O FilterPanel internamente também deve usar o useI18n) */}
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
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ActionButton onClick={selectAllVisible} icon={MousePointerClick} label={t('actions.selectAll') || "Selecionar todos"} variant="outline" isDarkMode={isDarkMode} />
            <ActionButton onClick={clearSelection} icon={X} label={t('actions.clear') || "Limpar"} variant="outline" isDarkMode={isDarkMode} />
            <ActionButton onClick={() => setIsCreateOpen(true)} icon={Plus} label={t('actions.newTable') || "Nova Tabela"} variant="primary" isDarkMode={isDarkMode} />
            <ActionButton onClick={handleDeleteSelectedTables} icon={Trash2} label={t('actions.delete') || "Excluir"} variant="danger" isDarkMode={isDarkMode} />

            {/* Divisor vertical */}
            <div className={`h-6 w-px mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

            <ActionButton onClick={() => setIsTransactionOpen(true)} icon={ArrowLeftRight} label={t('actions.transaction') || "Transação"} variant="secondary" isDarkMode={isDarkMode} />
            <ActionButton onClick={() => setIsBackupOpen(true)} icon={DatabaseBackup} label={t('actions.backup') || "Backup"} variant="secondary" isDarkMode={isDarkMode} />
            <ActionButton onClick={() => setIsDeadlocksOpen(true)} icon={Activity} label={t('actions.deadlocks') || "Deadlocks"} variant="secondary" isDarkMode={isDarkMode} />
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <span className={`text-sm font-medium px-3 py-1.5 rounded-md border ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"
              }`}>
              {filteredAndSortedTables.length} {filteredAndSortedTables.length === 1 ? (t('common.table') || "tabela") : (t('common.tables') || "tabelas")}
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('common.updating') || "Atualizando..."}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseHeader;

// --- Subcomponentes Refatorados ---

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'outline';
  isDarkMode: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon: Icon, label, variant, isDarkMode }) => {
  const baseClasses = "px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
    secondary: isDarkMode
      ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200",
    outline: isDarkMode
      ? "bg-transparent hover:bg-gray-800 text-gray-300 border-gray-700"
      : "bg-transparent hover:bg-gray-50 text-gray-600 border-gray-200",
    danger: isDarkMode
      ? "bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-900/50"
      : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  iconColor: string;
  bgColor: string;
  isDarkMode: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, value, iconColor, bgColor, isDarkMode }) => (
  <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200 shadow-sm"
    }`}>
    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : bgColor}`}>
      <Icon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : iconColor}`} />
    </div>
    <div>
      <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
        {title}
      </p>
      <p className={`text-base font-semibold mt-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  </div>
);