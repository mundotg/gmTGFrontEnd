"use client";
import React, { ChangeEvent, KeyboardEvent, useCallback, memo } from "react";
import { Info, X, Tag } from "lucide-react";

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
        flex items-center justify-between p-3 border rounded-lg transition-all
        hover:shadow-sm group
        ${isSelected 
          ? "border-blue-300 bg-blue-50 hover:bg-blue-100" 
          : "border-gray-200 bg-white hover:bg-gray-50"
        }
        ${isEditing ? "ring-2 ring-green-500 ring-opacity-50" : ""}
      `}
      data-table={table}
      data-selected={isSelected}
      data-editing={isEditing}
      role="listitem"
    >
      {/* Checkbox e nome da tabela */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors cursor-pointer"
          aria-label={`${isSelected ? 'Desmarcar' : 'Selecionar'} tabela ${table}`}
          id={`checkbox-${table}`}
        />
        
        <label 
          htmlFor={`checkbox-${table}`}
          className="text-sm font-medium text-gray-800 flex-1 truncate cursor-pointer select-none"
          title={table}
        >
          {table}
        </label>

        {/* Badge do alias quando não está editando */}
        {alias && !isEditing && (
          <span 
            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-mono border border-green-200 flex-shrink-0"
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
                  placeholder="Digite o alias..."
                  autoFocus
                  className={`
                    w-24 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-green-500 
                    focus:border-transparent transition-colors font-mono
                    ${aliasError 
                      ? "border-red-300 bg-red-50 text-red-900 placeholder-red-300" 
                      : "border-gray-300 bg-white text-gray-900"
                    }
                  `}
                  aria-invalid={!!aliasError}
                  aria-describedby={aliasError ? `error-${table}` : undefined}
                />
                {aliasError && (
                  <div 
                    className="absolute -top-1 -right-1 transform translate-x-1/2 -translate-y-1/2 group/error relative"
                    role="alert"
                  >
                    <Info className="w-3 h-3 text-red-500" />
                    <div 
                      id={`error-${table}`}
                      className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-red-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover/error:opacity-100 transition-opacity whitespace-nowrap z-10 max-w-xs"
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
                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Confirmar alias"
                  aria-label="Confirmar alias"
                >
                  <Tag className="w-3 h-3" />
                </button>
                <button
                  onClick={onCancelEditing}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Cancelar edição"
                  aria-label="Cancelar edição"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            // Modo visualização
            <>
              {alias && (
                <button
                  onClick={handleRemoveAlias}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  title={`Remover alias "${alias}"`}
                  aria-label={`Remover alias ${alias} da tabela ${table}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleStartEditing}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                title={alias ? `Editar alias "${alias}"` : "Adicionar alias"}
                aria-label={alias ? `Editar alias ${alias}` : `Adicionar alias para tabela ${table}`}
              >
                <Tag className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

TableItem.displayName = 'TableItem';