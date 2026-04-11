"use client";
import React, { useState, useEffect } from "react";
import { Database, X, Loader2, Info, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export interface SelectTablesModalProps {
  isOpen: boolean;
  tables: string[];
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (selectedTables: string[]) => void;

  // Customização Visual e de Texto
  variant?: "primary" | "danger";
  title?: string;
  message?: string;
  warningMsg?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
}

export default function SelectTablesModal({
  isOpen,
  tables,
  isLoading,
  onClose,
  onConfirm,
  variant = "primary",
  title,
  message,
  warningMsg,
  confirmText,
  // cancelText,
  loadingText,
}: SelectTablesModalProps) {
  const { t } = useI18n();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ✅ HOOKS SEMPRE NO TOPO: Selecionar todas as tabelas quando a modal abrir
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(tables));
    }
  }, [isOpen, tables]);

  // ✅ HOOKS SEMPRE NO TOPO: Confirmação automática se houver apenas 1 tabela
  useEffect(() => {
    if (isOpen && tables.length === 1) {
      onConfirm(tables);
    }
  }, [isOpen, tables, onConfirm]);

  // Funções auxiliares (Não são hooks, mas é boa prática mantê-las aqui)
  const toggleTable = (tableName: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName);
    } else {
      newSelected.add(tableName);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === tables.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tables));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  // Variáveis calculadas
  const isAllSelected = selected.size === tables.length;

  const colors = {
    iconBg: variant === "danger" ? "bg-red-100 border-red-200" : "bg-blue-100 border-blue-200",
    iconColor: variant === "danger" ? "text-red-600" : "text-blue-600",
    btnConfirm: variant === "danger"
      ? "bg-red-600 border-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:border-red-400 focus:ring-red-500/50"
      : "bg-blue-600 border-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 focus:ring-blue-500/50",
    checkIcon: variant === "danger" ? "text-red-600" : "text-blue-600",
    itemActive: variant === "danger" ? "bg-red-50 border-red-200 text-red-900" : "bg-blue-50 border-blue-200 text-blue-900",
    warningBg: variant === "danger" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200",
    warningIcon: variant === "danger" ? "text-amber-600" : "text-blue-600",
    warningText: variant === "danger" ? "text-amber-800" : "text-blue-800",
  };

  // 🚨 O RETORNO ANTECIPADO VEM SÓ DEPOIS DE TODOS OS HOOKS
  if (!isOpen) return null;

  // 🚨 O SEGUNDO RETORNO ANTECIPADO: Se for length == 1, a gente já mandou um onConfirm() lá em cima no useEffect.
  // Para evitar um "piscar" da modal na tela enquanto ela fecha, podemos não renderizar nada aqui também.
  if (tables.length === 1) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Botão fechar */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 border rounded-xl flex items-center justify-center shadow-sm ${colors.iconBg}`}>
              {variant === "danger" ? (
                <AlertTriangle className={`w-6 h-6 ${colors.iconColor}`} />
              ) : (
                <Database className={`w-6 h-6 ${colors.iconColor}`} />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {title || t("modals.selectTablesTitle") || "Selecionar Tabelas"}
              </h3>
              <p className="text-sm font-medium text-gray-500 mt-1.5 leading-relaxed pr-6">
                {message || t("modals.selectTablesMsg") || "Este registro envolve múltiplas tabelas. Selecione em quais delas deseja aplicar esta ação."}
              </p>
            </div>
          </div>

          {/* Lista de Tabelas */}
          <div className="mt-5 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-100/50 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                {t("common.tables") || "Tabelas"} ({tables.length})
              </span>
              <button
                type="button"
                onClick={toggleAll}
                disabled={isLoading}
                className={`text-xs font-bold hover:opacity-80 transition-colors disabled:opacity-50 ${colors.iconColor}`}
              >
                {isAllSelected
                  ? (t("actions.deselectAll") || "Desmarcar Todas")
                  : (t("actions.selectAll") || "Selecionar Todas")}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
              {tables.map((tName) => {
                const isSelected = selected.has(tName);
                return (
                  <button
                    key={tName}
                    onClick={() => toggleTable(tName)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                        ? colors.itemActive
                        : "bg-white border-transparent hover:bg-gray-100 hover:border-gray-200 text-gray-700"
                      }`}
                  >
                    {isSelected ? (
                      <CheckSquare className={`w-5 h-5 flex-shrink-0 ${colors.checkIcon}`} />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {tName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aviso adicional */}
          <div className={`mt-5 p-3 border rounded-xl flex gap-2 ${colors.warningBg}`}>
            <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.warningIcon}`} />
            <p className={`text-xs font-medium leading-relaxed ${colors.warningText}`}>
              {warningMsg || t("modals.selectTablesWarning") || "A ação será executada apenas nas tabelas marcadas acima. As demais serão ignoradas."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={handleConfirm}
            disabled={isLoading || selected.size === 0}
            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 ${colors.btnConfirm}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingText || t("actions.processing") || "Processando..."}
              </>
            ) : (
              confirmText || t("actions.confirmSelection") || "Confirmar Seleção"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}