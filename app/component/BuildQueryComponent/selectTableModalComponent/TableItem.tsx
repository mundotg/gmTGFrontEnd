"use client";
import React, { ChangeEvent, KeyboardEvent, useCallback, memo } from "react";
import { X, Tag, Check } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export type GenericListItemProps = {
  item: string;
  isInSelectedTab?: boolean;
  selected: string[];
  aliases: Record<string, string>;
  editingAlias: string | null;
  enableAliases?: boolean;

  onToggle: (item: string) => void;
  onAliasChange: (item: string, alias: string) => void;
  onStartEditing: (item: string) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  onRemoveAlias: (item: string) => void;
  getAliasError: (alias: string) => string | null;

  showDistinctOptions?: boolean;
  useDistinct?: boolean;
  enableDistinct?: boolean;
  handleDistinctToggle?: (checked: boolean) => void;
  distinctColumns?: string[];
  toggleDistinctColumn?: (column: string) => void;
  selectAllDistinctColumns?: () => void;
  clearAllDistinctColumns?: () => void;
};

export const GenericListItem: React.FC<GenericListItemProps> = memo(({
  item,
  isInSelectedTab = false,
  selected,
  aliases,
  editingAlias,
  enableAliases = true,
  onToggle,
  onAliasChange,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onRemoveAlias,
  getAliasError,
  showDistinctOptions,
  distinctColumns,
  toggleDistinctColumn,
}) => {
  const { t } = useI18n();

  const isSelected = selected.some((selectedItem) => {
    let sItem = selectedItem.trim().toLowerCase().replace(/^dbo\./, "");
    let tItem = item.trim().toLowerCase().replace(/^dbo\./, "");
    return sItem === tItem || sItem.endsWith(`.${tItem}`) || tItem.endsWith(`.${sItem}`);
  });

  const alias = aliases[item] || "";
  const aliasError = getAliasError(alias);
  const isEditing = editingAlias === item;
  const isDistinct = distinctColumns?.includes(item) ?? false;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = useCallback(() => onToggle(item), [onToggle, item]);

  const handleAliasChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onAliasChange(item, e.target.value),
    [onAliasChange, item]
  );

  const handleStartEditing = useCallback(() => onStartEditing(item), [onStartEditing, item]);
  const handleRemoveAlias = useCallback(() => onRemoveAlias(item), [onRemoveAlias, item]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); onFinishEditing(); }
      else if (e.key === "Escape") { e.preventDefault(); onCancelEditing(); }
    },
    [onFinishEditing, onCancelEditing]
  );

  const handleBlur = useCallback(() => {
    if (!aliasError) onFinishEditing();
  }, [onFinishEditing, aliasError]);

  const handleDistinctClick = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); toggleDistinctColumn?.(item); },
    [toggleDistinctColumn, item]
  );


  // ─── Derived state ────────────────────────────────────────────────────────────

  const showSecondaryRow = isSelected && isInSelectedTab;
  const showAliasControls = enableAliases && showSecondaryRow;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={`
        flex flex-col border rounded-xl transition-all
        ${isSelected
          ? "border-blue-500 bg-blue-50/30 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
        }
        ${isEditing ? "ring-2 ring-blue-500/30" : ""}
      `}
      data-item={item}
      data-selected={isSelected}
      data-editing={isEditing}
      role="listitem"
    >
      {/* ── Linha principal: checkbox + nome + badge alias (readonly) ── */}
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Checkbox */}
        <div
          className="relative flex items-center justify-center cursor-pointer flex-shrink-0"
          onClick={handleToggle}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          onKeyDown={(e) => e.key === " " && handleToggle()}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${isSelected
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-300 hover:border-blue-400"
              }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </div>
        </div>

        {/* Nome */}
        <span
          className={`text-sm flex-1 truncate cursor-pointer select-none ${isSelected ? "font-bold text-gray-900" : "font-medium text-gray-700"
            }`}
          title={item}
          onClick={handleToggle}
        >
          {item}
        </span>

        {/* Badge alias — visível na linha principal quando NÃO está editando */}
        {enableAliases && alias && !isEditing && (
          <span
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-md font-mono tracking-wide flex-shrink-0"
            title={`Alias: ${alias}`}
          >
            as {alias}
          </span>
        )}
      </div>

      {/* ── Linha secundária: DISTINCT + controles de alias ── */}
      {showSecondaryRow && (
        <div
          className={`
            flex items-center gap-2 px-3 pb-2.5 pl-11 flex-wrap
            border-t border-gray-100
          `}
        >
          {/* Botão DISTINCT */}
          {showDistinctOptions && (
            <button
              onClick={handleDistinctClick}
              className={`
                px-2.5 py-1 text-[11px] font-bold rounded-md border cursor-pointer
                transition-all select-none focus:outline-none focus:ring-2 focus:ring-blue-400/50
                ${isDistinct
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-500 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                }
              `}
              aria-pressed={isDistinct}
              title={isDistinct ? "Remover DISTINCT" : "Aplicar DISTINCT"}
            >
              DISTINCT
            </button>
          )}

          {/* Separador visual se ambas as features estão ativas */}
          {showDistinctOptions && showAliasControls && (
            <span className="text-gray-200 select-none">|</span>
          )}

          {/* Controles de alias */}
          {showAliasControls && (
            <>
              {isEditing ? (
                /* Modo edição inline */
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="text"
                      value={alias}
                      onChange={handleAliasChange}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      placeholder={t("modal.typeAlias") || "alias SQL..."}
                      autoFocus
                      maxLength={30}
                      className={`
                        w-32 px-2.5 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2
                        transition-colors font-mono font-medium
                        ${aliasError
                          ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-400/40"
                          : "border-blue-400 bg-white text-gray-900 focus:ring-blue-400/40"
                        }
                      `}
                      aria-invalid={!!aliasError}
                      aria-describedby={aliasError ? `error-${item}` : `hint-${item}`}
                    />
                  </div>

                  {/* Confirmar */}
                  <button
                    onClick={onFinishEditing}
                    disabled={!!aliasError}
                    className="p-1.5 text-green-600 bg-white border border-transparent hover:border-green-300 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    title={t("actions.confirmAlias") || "Confirmar alias"}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>

                  {/* Cancelar */}
                  <button
                    onClick={onCancelEditing}
                    className="p-1.5 text-gray-400 bg-white border border-transparent hover:border-gray-300 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/40"
                    title={t("actions.cancelEditing") || "Cancelar edição"}
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>

                  {/* Mensagem de erro ou dica de teclado */}
                  {aliasError ? (
                    <span id={`error-${item}`} className="text-[11px] text-red-600" role="alert">
                      {aliasError}
                    </span>
                  ) : (
                    <span id={`hint-${item}`} className="text-[11px] text-gray-400 select-none">
                      Enter para confirmar · Esc para cancelar
                    </span>
                  )}
                </div>
              ) : (
                /* Modo visualização — sempre visível (sem hover) */
                <div className="flex items-center gap-1.5">
                  {alias && (
                    <button
                      onClick={handleRemoveAlias}
                      className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/50"
                      title={`Remover alias "${alias}"`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleStartEditing}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-[11px] font-medium
                      focus:outline-none focus:ring-2 focus:ring-indigo-400/50
                      ${alias
                        ? "text-indigo-600 hover:bg-indigo-50"
                        : "text-gray-400 border border-dashed border-gray-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                      }
                    `}
                    title={alias ? `Editar alias "${alias}"` : "Adicionar alias"}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{alias ? "Editar alias" : "Alias"}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

GenericListItem.displayName = "GenericListItem";