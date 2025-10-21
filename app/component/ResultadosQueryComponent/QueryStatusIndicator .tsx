import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { SSEState } from '@/hook/queryExecuteUse';

interface QueryStatusIndicatorProps {
  sseState: SSEState;
  progress: string;
  executingQuery: boolean;
  onCancel?: () => void;
}

const QueryStatusIndicator: React.FC<QueryStatusIndicatorProps> = ({
  sseState,
  progress,
  executingQuery,
  onCancel
}) => {
  const getStatusConfig = () => {
    switch (sseState) {
      case SSEState.CONNECTING:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Conectando...',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case SSEState.CONNECTED:
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Conectado',
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case SSEState.PROCESSING:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Processando...',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        };
      case SSEState.COMPLETED:
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Concluído',
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case SSEState.ERROR:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Erro',
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between px-3 py-2 border rounded-md ${statusConfig.color}`}>
      <div className="flex items-center gap-2">
        {statusConfig.icon}
        <span className="text-sm font-medium">{statusConfig.text}</span>
        {progress && (
          <span className="text-sm opacity-75">- {progress}</span>
        )}
      </div>
      
      {executingQuery && onCancel && (
        <button
          onClick={onCancel}
          className="ml-2 p-1 hover:bg-black/10 rounded transition-colors"
          title="Cancelar query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default QueryStatusIndicator;