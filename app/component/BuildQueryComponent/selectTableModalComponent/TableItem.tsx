"use client";
import React, { ChangeEvent, KeyboardEvent, useCallback, memo } from "react";
import { Info, X, Tag, Check } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export type TableItemProps = {
  table: string;
  /** Se está na aba de selecionados */
  isInSelectedTab?: boolean;
  /** Lista de tabelas selecionadas */
  selected: string[];
  /** Mapa de aliases por tabela */
  tableAliases: Record<string, string>;
  /** Qual tabela está com alias em edição */
  editingAlias: string | null;

  // Callbacks
  onToggle: (table: string) => void;
  onAliasChange: (table: string, alias: string) => void;
  onStartEditing: (table: string) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  onRemoveAlias: (table: string) => void;
  getAliasError: (alias: string) => string | null;
};

export const TableItem: React.FC<TableItemProps> = memo(({
  table,
  isInSelectedTab = false,
  selected,
  tableAliases,
  editingAlias,
  onToggle,
  onAliasChange,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onRemoveAlias,
  getAliasError,
}) => {
  const { t } = useI18n();
  const isSelected = selected.includes(table);
  const alias = tableAliases[table] || "";
  const aliasError = getAliasError(alias);
  const isEditing = editingAlias === table;

  // Handlers memoizados para performance
  const handleToggle = useCallback(() => {
    onToggle(table);
  }, [onToggle, table]);

  const handleAliasChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onAliasChange(table, e.target.value);
  }, [onAliasChange, table]);

  const handleStartEditing = useCallback(() => {
    onStartEditing(table);
  }, [onStartEditing, table]);

  const handleRemoveAlias = useCallback(() => {
    onRemoveAlias(table);
  }, [onRemoveAlias, table]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onFinishEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEditing();
    }
  }, [onFinishEditing, onCancelEditing]);

  const handleBlur = useCallback(() => {
    // Só finaliza a edição se não houver erro
    if (!aliasError) {
      onFinishEditing();
    }
  }, [onFinishEditing, aliasError]);

  // Determinar se deve mostrar controles de alias
  const showAliasControls = isInSelectedTab && isSelected;

  return (
    <div
      className={`
        flex items-center justify-between p-3 border rounded-xl transition-all
        group focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${isSelected 
          ? "border-blue-500 bg-blue-50/30 shadow-sm" 
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
        }
        ${isEditing ? "ring-2 ring-blue-500/30" : ""}
      `}
      data-table={table}
      data-selected={isSelected}
      data-editing={isEditing}
      role="listitem"
    >
      {/* Checkbox e nome da tabela */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        
        {/* Checkbox Customizado */}
        <div
          className="relative flex items-center justify-center cursor-pointer"
          onClick={handleToggle}
        >
           <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-300 text-transparent group-hover:border-blue-400"
            }`}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </div>
        
        <label 
          htmlFor={`checkbox-${table}`}
          className={`text-sm flex-1 truncate cursor-pointer select-none ${isSelected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}
          title={table}
          onClick={handleToggle}
        >
          {table}
        </label>

        {/* Badge do alias quando não está editando */}
        {alias && !isEditing && (
          <span 
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-md font-mono tracking-wide flex-shrink-0"
            title={`Alias: ${alias}`}
          >
            as {alias}
          </span>
        )}
      </div>

      {/* Controles de alias */}
      {showAliasControls && (
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {isEditing ? (
            // Modo edição
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={alias}
                  onChange={handleAliasChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={t("modalTable.typeAlias") || "Digite o alias..."}
                  autoFocus
                  className={`
                    w-28 px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2
                    transition-colors font-mono font-medium shadow-sm
                    ${aliasError 
                      ? "border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/50" 
                      : "border-blue-300 bg-white text-gray-900 focus:ring-blue-500/50"
                    }
                  `}
                  aria-invalid={!!aliasError}
                  aria-describedby={aliasError ? `error-${table}` : undefined}
                />
                {aliasError && (
                  <div 
                    className="absolute -top-1.5 -right-1.5 transform translate-x-1/2 -translate-y-1/2 group/error"
                    role="alert"
                  >
                    <Info className="w-4 h-4 text-red-500 bg-white rounded-full" />
                    <div 
                      id={`error-${table}`}
                      className="absolute bottom-full right-0 mb-1.5 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover/error:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg"
                    >
                      {aliasError}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botões de ação durante edição */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onFinishEditing}
                  disabled={!!aliasError}
                  className="p-1.5 text-green-600 bg-white border border-transparent hover:border-green-200 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-sm"
                  title={t("actions.confirmAlias") || "Confirmar alias"}
                  aria-label={t("actions.confirmAlias") || "Confirmar alias"}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
                <button
                  onClick={onCancelEditing}
                  className="p-1.5 text-gray-500 bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                  title={t("actions.cancelEditing") || "Cancelar edição"}
                  aria-label={t("actions.cancelEditing") || "Cancelar edição"}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          ) : (
            // Modo visualização
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {alias && (
                <button
                  onClick={handleRemoveAlias}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  title={`${t("actions.removeAlias") || "Remover alias"} "${alias}"`}
                  aria-label={t("actions.removeAlias") || "Remover alias"}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleStartEditing}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                title={alias ? (`${t("actions.editAlias") || "Editar alias"} "${alias}"`) : (t("actions.addAlias") || "Adicionar alias")}
                aria-label={t("actions.addAlias") || "Adicionar alias"}
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TableItem.displayName = 'TableItem';