"use client";
import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { SSEState } from '@/hook/queryExecuteUse';
import { useI18n } from '@/context/I18nContext';

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
  const { t } = useI18n();

  const getStatusConfig = () => {
    switch (sseState) {
      case SSEState.CONNECTING:
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: t("queryStatus.connecting") || 'Conectando...',
          color: 'text-blue-700 bg-blue-50 border-blue-200'
        };
      case SSEState.CONNECTED:
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          text: t("queryStatus.connected") || 'Conectado',
          color: 'text-green-700 bg-green-50 border-green-200'
        };
      case SSEState.PROCESSING:
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: t("queryStatus.processing") || 'Processando...',
          color: 'text-amber-700 bg-amber-50 border-amber-200'
        };
      case SSEState.COMPLETED:
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          text: t("queryStatus.completed") || 'Concluído',
          color: 'text-green-700 bg-green-50 border-green-200'
        };
      case SSEState.ERROR:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          text: t("queryStatus.error") || 'Erro',
          color: 'text-red-700 bg-red-50 border-red-200'
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
    <div className={`flex items-center justify-between px-4 py-3 border rounded-xl shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95 ${statusConfig.color}`}>
      <div className="flex items-center gap-3">
        {statusConfig.icon}
        <span className="text-sm font-bold tracking-wide">{statusConfig.text}</span>
        {progress && (
          <span className="text-sm font-medium opacity-80 flex items-center gap-2">
            <span className="opacity-50">•</span> {progress}
          </span>
        )}
      </div>
      
      {executingQuery && onCancel && (
        <button
          onClick={onCancel}
          className="ml-3 p-1.5 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-current opacity-70 hover:opacity-100"
          title={t("actions.cancelQuery") || "Cancelar query"}
          aria-label={t("actions.cancelQuery") || "Cancelar query"}
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default QueryStatusIndicator;