"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";
import {
  Database, Sun, Moon, RefreshCw, Grid, Eye, Code, Zap, Activity,
  Key, Server, Settings, CheckCircle2, XCircle, DatabaseBackup,
  ArrowLeftRight, Loader2, Plus, Trash2, MousePointerClick, X
} from "lucide-react";
import { TableInfo, Usuario } from "@/types";
import { FilterPanel } from "./FilterPanel";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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
  isDarkMode: boolean;
  desableTablesSystem: boolean;
  setDesableTablesSystem: (value: boolean) => void;
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

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({
  isDarkMode,
  setIsDarkMode,
  healthStatus,
  desableTablesSystem,
  setDesableTablesSystem,
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
  schemas,
}) => {
  const { t } = useI18n();

  const dm = isDarkMode;

  // Shared class helpers
  const surface = dm
    ? "bg-[#1C1C1E] border-gray-800"
    : "bg-white border-gray-200";

  const iconBtn = `
    w-8 h-8 flex items-center justify-center rounded-lg border transition-colors
    ${dm
      ? "bg-[#2C2C2E] border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    }
  `;

  const tableCount = filteredAndSortedTables.length;
  const isHealthy = healthStatus?.status === "healthy";

  return (
    <div className={`border-b ${surface} pb-0`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ── TOP ROW: Brand + Controls ── */}
        <div className="flex items-center justify-between gap-4 mb-5">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-medium leading-tight ${dm ? "text-white" : "text-gray-900"}`}>
                {t("database.explorer") || "Database Explorer"}
              </h1>
              <p className={`text-xs mt-0.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                {metadata?.server_version || t("database.advancedManagement") || "Gerenciamento avançado de banco de dados"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Health badge */}
            {healthStatus && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isHealthy
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
                }`}>
                {isHealthy
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <XCircle className="w-3.5 h-3.5" />
                }
                {isHealthy
                  ? (t("status.connected") || "Conectado")
                  : (t("status.error") || "Erro")}
              </div>
            )}

            <button
              className={iconBtn}
              onClick={() => setIsDarkMode(!dm)}
              title={t("actions.toggleTheme") || "Alternar tema"}
            >
              {dm ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              className={iconBtn}
              onClick={handleRefresh}
              disabled={isLoading}
              title={t("actions.refresh") || "Atualizar"}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          <MiniStat icon={Grid} label={t("stats.tables") || "Tabelas"} value={metadata?.table_count ?? 0} color="text-blue-600" dm={dm} />
          <MiniStat icon={Eye} label={t("stats.views") || "Views"} value={metadata?.view_count ?? 0} color="text-green-600" dm={dm} />
          <MiniStat icon={Code} label={t("stats.procedures") || "Procedures"} value={metadata?.procedure_count ?? 0} color="text-purple-600" dm={dm} />
          <MiniStat icon={Zap} label={t("stats.functions") || "Functions"} value={metadata?.function_count ?? 0} color="text-orange-500" dm={dm} />
          <MiniStat icon={Activity} label={t("stats.triggers") || "Triggers"} value={metadata?.trigger_count ?? 0} color="text-red-500" dm={dm} />
          <MiniStat icon={Key} label={t("stats.indexes") || "Indexes"} value={metadata?.index_count ?? 0} color="text-cyan-600" dm={dm} />
        </div>

        {/* ── SERVER INFO ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <InfoCard icon={Server} label={t("connection.host") || "Servidor"} value={metadata?.database_name || "N/A"} iconBg="bg-blue-50" iconColor="text-blue-600" dm={dm} />
          <InfoCard icon={Database} label={t("connection.database") || "Banco de dados"} value={metadata?.database_name || "N/A"} iconBg="bg-green-50" iconColor="text-green-600" dm={dm} />
          <InfoCard icon={Settings} label={t("connection.type") || "Tipo"} value={user?.info_extra?.type || "N/A"} iconBg="bg-purple-50" iconColor="text-purple-600" dm={dm} />
        </div>

        {/* ── FILTER PANEL ── */}
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
          isDarkMode={dm}
        />

      </div>

      {/* ── DIVIDER ── */}
      <div className={`border-t mt-4 ${dm ? "border-gray-800" : "border-gray-100"}`} />

      {/* ── ACTIONS BAR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">

        {/* Left group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ActionBtn onClick={selectAllVisible} icon={MousePointerClick} label={t("actions.selectAll") || "Selecionar"} variant="outline" dm={dm} />
          <ActionBtn onClick={clearSelection} icon={X} label={t("actions.clear") || "Limpar"} variant="outline" dm={dm} />
          <ActionBtn onClick={() => setIsCreateOpen(true)} icon={Plus} label={t("actions.newTable") || "Nova tabela"} variant="primary" dm={dm} />
          <ActionBtn onClick={handleDeleteSelectedTables} icon={Trash2} label={t("actions.delete") || "Excluir"} variant="danger" dm={dm} />

          <div className={`h-5 w-px mx-1 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />

          <ActionBtn onClick={() => setIsTransactionOpen(true)} icon={ArrowLeftRight} label={t("actions.transaction") || "Transação"} variant="secondary" dm={dm} />
          <ActionBtn onClick={() => setIsBackupOpen(true)} icon={DatabaseBackup} label={t("actions.backup") || "Backup"} variant="secondary" dm={dm} />
          <ActionBtn onClick={() => setIsDeadlocksOpen(true)} icon={Activity} label={t("actions.deadlocks") || "Deadlocks"} variant="secondary" dm={dm} />

          <div className={`h-5 w-px mx-1 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />

          <Link
            href="/home/editorsql"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
              }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("actions.editSqlAdvanced") || "Editor SQL"}</span>
          </Link>

          <Link
            href="/home/mll"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("actions.diagramClass") || "Diagrama"}</span>
          </Link>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${dm ? "text-gray-400" : "text-gray-500"}`}>
            <input
              type="checkbox"
              checked={desableTablesSystem}
              onChange={(e) => setDesableTablesSystem(e.target.checked)}
              className="accent-blue-600"
            />
            {t("actions.disableTablesSystem") || "Ocultar sys tables"}
          </label>

          <span className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border ${dm
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-gray-50 border-gray-200 text-gray-600"
            }`}>
            {tableCount} {tableCount === 1 ? (t("common.table") || "tabela") : (t("common.tables") || "tabelas")}
          </span>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-blue-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs font-medium">{t("common.updating") || "Atualizando..."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseHeader;

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

// Compact stat card (replaces the old StatCard for this header)
interface MiniStatProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  dm: boolean;
}

const MiniStat: React.FC<MiniStatProps> = ({ icon: Icon, label, value, color, dm }) => (
  <div className={`flex flex-col gap-1.5 p-3 rounded-xl ${dm ? "bg-[#2C2C2E]" : "bg-gray-50"}`}>
    <Icon className={`w-4 h-4 ${color}`} />
    <div className={`text-xl font-medium leading-none ${dm ? "text-white" : "text-gray-900"}`}>
      {value}
    </div>
    <div className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>{label}</div>
  </div>
);

// Server info card
interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  dm: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, iconBg, iconColor, dm }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${dm ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-100"
    }`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-gray-800" : iconBg}`}>
      <Icon className={`w-4 h-4 ${dm ? "text-gray-400" : iconColor}`} />
    </div>
    <div className="min-w-0">
      <div className={`text-[10px] uppercase tracking-wider font-medium ${dm ? "text-gray-500" : "text-gray-400"}`}>
        {label}
      </div>
      <div className={`text-sm font-medium truncate mt-0.5 ${dm ? "text-white" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  </div>
);

// Action button
interface ActionBtnProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant: "primary" | "secondary" | "danger" | "outline";
  dm: boolean;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ onClick, icon: Icon, label, variant, dm }) => {
  const base = "flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium border transition-colors";

  const styles: Record<string, string> = {
    primary: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
    danger: dm
      ? "bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/50"
      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    outline: dm
      ? "bg-transparent text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-200"
      : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800",
    secondary: dm
      ? "bg-[#2C2C2E] text-gray-300 border-gray-700 hover:bg-gray-700"
      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
  };

  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};