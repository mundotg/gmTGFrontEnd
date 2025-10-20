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
} from "lucide-react";
import { StatCard } from "./statCard";
import { Usuario } from "@/context/SessionContext";

interface HealthStatus {
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
}) => {

    // Componente: Badge de Status
    const StatusBadge = ({ status, label }: { status: 'healthy' | 'warning' | 'error', label: string }) => {
        const styles = {
            healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
            warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
            error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
        };
        
        const icons = {
            healthy: <CheckCircle2 className="w-4 h-4" />,
            warning: <AlertCircle className="w-4 h-4" />,
            error: <XCircle className="w-4 h-4" />
        };
    
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${styles[status]}`}>
                {icons[status]}
                <span>{label}</span>
            </div>
        );
    };
  return (
    <div className={`${cardClasses} border-b shadow-sm sticky top-0 z-10`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Título e Controles */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Database Explorer
              </h1>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {metadata?.server_version ||
                  "Gerenciamento Avançado de Banco de Dados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {healthStatus && (
              <StatusBadge
                status={
                  healthStatus.status === "healthy" ? "healthy" : "error"
                }
                label={
                  healthStatus.status === "healthy" ? "Conectado" : "Erro"
                }
              />
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-lg transition-all ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              title="Alternar tema"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-2.5 rounded-lg transition-all disabled:opacity-50 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              title="Atualizar dados"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Estatísticas em Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            icon={Grid}
            label="Tabelas"
            value={metadata?.table_count || 0}
            colorClass="text-blue-500"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Eye}
            label="Views"
            value={metadata?.view_count || 0}
            colorClass="text-green-500"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Code}
            label="Procedures"
            value={metadata?.procedure_count || 0}
            colorClass="text-purple-500"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Zap}
            label="Functions"
            value={metadata?.function_count || 0}
            colorClass="text-orange-500"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Activity}
            label="Triggers"
            value={metadata?.trigger_count || 0}
            colorClass="text-red-500"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Key}
            label="Indexes"
            value={metadata?.index_count || 0}
            colorClass="text-cyan-500"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Informações do Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon={Server}
            title="Servidor"
            value={metadata?.database_name || "N/A"}
            color="text-blue-500"
            isDarkMode={isDarkMode}
          />
          <InfoCard
            icon={Database}
            title="Banco de Dados"
            value={metadata?.database_name || "N/A"}
            color="text-green-500"
            isDarkMode={isDarkMode}
          />
          <InfoCard
            icon={Settings}
            title="Tipo"
            value={user?.InfPlus?.type || "N/A"}
            color="text-purple-500"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default DatabaseHeader;

// Subcomponente reutilizável para InfoCard
interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
  isDarkMode: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
  isDarkMode,
}) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg ${
      isDarkMode ? "bg-gray-700/50" : "bg-gray-100"
    }`}
  >
    <Icon className={`w-5 h-5 ${color}`} />
    <div>
      <p
        className={`text-xs font-medium ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {title}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);


