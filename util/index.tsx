import { CampoDetalhado } from "@/types";
import { AlertCircle, Calendar, Database, Hash, Type } from "lucide-react";

// Componente de Loading Skeleton
export const ColumnSkeleton = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className={`animate-pulse p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
    <div className="flex items-start gap-3">
      <div className={`w-5 h-5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className="flex-1">
        <div className={`h-4 rounded mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-3 rounded w-2/3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
    </div>
  </div>
);

// Componente de Error
export const ErrorDisplay = ({ error, theme }: { error: string; theme: 'light' | 'dark' }) => (
  <div className={`p-6 rounded-lg border-2 border-dashed ${theme === 'dark'
    ? 'border-red-800 bg-red-900/20 text-red-300'
    : 'border-red-200 bg-red-50 text-red-600'
    }`}>
    <div className="flex items-center gap-3">
      <AlertCircle className="w-6 h-6" />
      <div>
        <h3 className="font-semibold">Erro ao carregar colunas</h3>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    </div>
  </div>
);

// Função aprimorada para ícones
export const getColumnIcon = (column: CampoDetalhado, theme: 'light' | 'dark') => {
  const iconClass = `w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`;

  switch (column.tipo.toLowerCase()) {
    case 'varchar':
    case 'text':
    case 'string':
      return <Type className={iconClass} />;
    case 'int':
    case 'integer':
    case 'bigint':
    case 'number':
      return <Hash className={iconClass} />;
    case 'datetime':
    case 'timestamp':
    case 'date':
      return <Calendar className={iconClass} />;
    default:
      return <Database className={iconClass} />;
  }
};
