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

  export const Badge = ({ color, text, icon }: { color: "green" | "blue" | "gray" | "yellow", text: string, icon?: React.ReactNode }) => (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded badge-base 
      ${color === 'green' && 'bg-green-50 text-green-600'}
      ${color === 'blue' && 'bg-blue-50 text-blue-600'}
      ${color === 'gray' && 'bg-gray-100 text-gray-600'}
      ${color === 'yellow' && 'bg-yellow-50 text-yellow-500'}
    `}>
      {icon}
      {text}
    </span>
  );

 export const validateField = (columnType: string, value: string): string | null => {
    if (!value.trim()) return null;

    switch (columnType.toLowerCase()) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Email inválido';
      case 'int':
      case 'integer':
        return isNaN(Number(value)) ? 'Deve ser um número inteiro' : null;
      case 'float':
      case 'decimal':
        return isNaN(Number(value)) ? 'Deve ser um número decimal' : null;
      case 'date':
        return isNaN(Date.parse(value)) ? 'Data inválida' : null;
      default:
        return null;
    }
  };
