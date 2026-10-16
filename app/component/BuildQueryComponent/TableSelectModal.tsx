"use client";
import React, { useCallback, useMemo, useState } from "react";
import { X, Check, Columns3, HelpCircle, ChevronDown, ChevronUp, Code2, Tag, Sparkles, Eye, EyeOff } from "lucide-react";
import { RenderTabContent } from "./selectTableModalComponent/RenderTabContent";
import { useI18n } from "@/context/I18nContext";
import { useTableSelect } from "@/hook/useTableSelect";
import { TableSearchToolbar } from "./selectTableModalComponent/TableSearchToolbar";

const NOOP = () => { };

export interface ItemWithSubItems {
  itemName: string;
  subItems: Array<{
    nome: string;
    tipo: string;
  }>;
}

export interface GenericSelectModalProps {
  items: string[];
  db_type_on?: string;
  selectedItems: string[];
  subItemsMap?: ItemWithSubItems[];
  initialAliases?: Record<string, string>;
  onClose: () => void;
  onSave: (items: string[], useDistinct: boolean, distinctSubItems?: string[], aliases?: Record<string, string>) => void;
  enableDistinct?: boolean;
  enableAliases?: boolean;
  useDistinct?: boolean;
  title?: string;
  tableSelected?: string[];
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  icon?: React.ReactNode;
}

const ALIAS_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function GenericSelectModal({
  items,
  tableSelected,
  selectedItems,
  useDistinct: propUseDistinct,
  onClose,
  onSave,
  subItemsMap = [],
  initialAliases = {},
  enableDistinct = true,
  enableAliases = true,
  title = "Colunas da Consulta (SELECT)",
  itemLabelSingular = "coluna",
  itemLabelPlural = "colunas",
  icon = <Columns3 className="w-5 h-5 text-blue-600" />,
}: GenericSelectModalProps) {
  const { t } = useI18n();
  const [showHelp, setShowHelp] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTableFilter, setActiveTableFilter] = useState<string | null>(null);

  // Extrair tabelas únicas a partir de itens no formato 'tabela.coluna'
  const availableTables = useMemo(() => {
    const tbls = new Set<string>();
    items.forEach((item) => {
      const parts = item.split(".");
      if (parts.length >= 2) {
        tbls.add(parts[0]);
      }
    });
    return Array.from(tbls);
  }, [items]);

  // Itens filtrados pelo chip de tabela, se selecionado
  const itemsFilteredByTable = useMemo(() => {
    if (!activeTableFilter) return items;
    return items.filter((item) => item.startsWith(`${activeTableFilter}.`));
  }, [items, activeTableFilter]);

  const {
    localSelection,
    searchTerm,
    useDistinct,
    activeTab,
    tableAliases,
    distinctColumns,
    showDistinctOptions,
    editingAlias,
    filteredTables,
    filteredSelectedTables,
    isValidSelection,
    setSearchTerm,
    toggleTable,
    handleSave,
    selectAll,
    clearAll,
    setActiveTab,
    handleDistinctToggle,
    toggleDistinctColumn,
    selectAllDistinctColumns,
    clearAllDistinctColumns,
    handleAliasChange,
    startEditingAlias,
    finishEditingAlias,
    setEditingAlias,
    removeAlias,
  } = useTableSelect({
    propUseDistinct,
    allTables: itemsFilteredByTable,
    selected: selectedItems,
    tableSelected,
    onClose,
    onSave,
    columnMap: subItemsMap as any,
    initialAliases,
  });

  const getAliasError = useCallback(
    (alias: string): string | null => {
      if (!alias.trim()) return null;
      const trimmedAlias = alias.trim();
      if (!ALIAS_REGEX.test(trimmedAlias)) return t("modal.invalidAlias") || "Inválido (use letras, números ou _)";

      const otherAliases = Object.entries(tableAliases)
        .filter(([table]) => table !== editingAlias)
        .map(([, a]) => a.trim())
        .filter((a) => a);

      if (otherAliases.includes(trimmedAlias)) return t("modal.duplicateAlias") || "Apelido já utilizado";
      return null;
    },
    [tableAliases, editingAlias, t]
  );

  const selectionCount = localSelection.length;
  const distinctCount = distinctColumns.length;
  const aliasCount = Object.values(tableAliases).filter((alias) => alias.trim()).length;

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      aria-label="useSelectModal"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 relative max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-xl border border-blue-200/80 shadow-xs">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  {title}
                </h2>
                <button
                  onClick={() => setShowHelp((prev) => !prev)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                  title="Entenda como funciona esta tela"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Para que serve?</span>
                </button>
                <button
                  onClick={() => setShowPreview((prev) => !prev)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors border ${
                    showPreview
                      ? "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border-gray-200"
                      : "text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border-purple-200"
                  }`}
                  title={showPreview ? "Ocultar pré-visualização SQL" : "Exibir pré-visualização SQL"}
                >
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{showPreview ? "Ocultar SQL" : "Ver SQL"}</span>
                </button>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                <span>
                  {selectionCount === 0 ? (
                    <strong className="text-blue-700 font-semibold">Todas as colunas selecionadas (SELECT *)</strong>
                  ) : (
                    <>
                      <strong className="text-gray-900">{selectionCount}</strong> {t("common.of") || "de"}{" "}
                      {items.length} {itemLabelPlural} {t("modal.selectedPlural") || "selecionadas"}
                    </>
                  )}
                </span>

                {enableDistinct && useDistinct && distinctCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold tracking-wider">
                    DISTINCT: {distinctCount}
                  </span>
                )}
                {enableAliases && aliasCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-bold tracking-wider">
                    ALIAS: {aliasCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label={t("actions.close") || "Fechar modal"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GUIA EDUCATIVO (Para que serve?) */}
        {showHelp && (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border-b border-blue-200/70 p-3.5 sm:px-6 sm:py-3.5 flex-shrink-0 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 w-full">
                {/* Dica 1: Projeção de colunas */}
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg mt-0.5">
                    <Columns3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">1. Campos Retornados</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                      Escolha quais colunas aparecerão na tabela de resultados. Se nenhuma for marcada, trará todas (<code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded">SELECT *</code>).
                    </p>
                  </div>
                </div>

                {/* Dica 2: Apelidos */}
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                  <div className="p-1.5 bg-green-100 text-green-700 rounded-lg mt-0.5">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">2. Apelidos (AS Alias)</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                      Na aba <strong>Selecionadas</strong>, clique em <em>Alias</em> para renomear colunas técnicas com nomes amigáveis nos relatórios.
                    </p>
                  </div>
                </div>

                {/* Dica 3: Distinct */}
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">3. Sem Duplicados</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                      Ative a opção <strong>DISTINCT</strong> para filtrar e descartar registros com dados repetidos na consulta.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-blue-100/50 transition-colors"
                title="Ocultar guia"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* LIVE SQL PREVIEW */}
        {showPreview && (
          <div className="px-4 sm:px-6 pt-3 pb-1 bg-white border-b border-gray-100 flex-shrink-0 animate-in fade-in duration-150">
            <div className="p-2.5 bg-gray-900 text-gray-100 rounded-xl border border-gray-800 font-mono text-xs shadow-inner flex flex-col gap-1">
              <div className="flex items-center justify-between text-gray-400 text-[11px] font-sans">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-400">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Pré-visualização SQL em Tempo Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px]">
                    {selectionCount === 0 ? "Padrão: todas as colunas" : `${selectionCount} campo(s) projetado(s)`}
                  </span>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-200 p-0.5 rounded hover:bg-gray-800 transition-colors"
                    title="Ocultar pré-visualização SQL"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto whitespace-pre py-0.5 text-xs">
                <span className="text-purple-400 font-bold">SELECT </span>
                {useDistinct && <span className="text-amber-400 font-bold">DISTINCT </span>}
                {selectionCount === 0 ? (
                  <span className="text-gray-400 italic">*  {/* Retornará todas as colunas das tabelas */}</span>
                ) : (
                  localSelection.map((col, idx) => {
                    const alias = tableAliases[col]?.trim();
                    return (
                      <span key={col}>
                        <span className="text-blue-300">{col}</span>
                        {alias && (
                          <>
                            <span className="text-purple-400 font-bold"> AS </span>
                            <span className="text-green-300 font-bold">{alias}</span>
                          </>
                        )}
                        {idx < localSelection.length - 1 && <span className="text-gray-400">, </span>}
                      </span>
                    );
                  })
                )}
                <span className="text-purple-400 font-bold"> FROM </span>
                <span className="text-gray-300">
                  {tableSelected && tableSelected.length > 0 ? tableSelected.join(", ") : "..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR COM PESQUISA, FILTROS E DISTINCT */}
        <div className="flex-shrink-0">
          <TableSearchToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            selectAllCount={activeTab === "all" ? filteredTables.length : items.length}
            isSelectAllDisabled={(activeTab === "all" ? filteredTables : items).length === 0}
            useDistinct={enableDistinct ? useDistinct : false}
            onDistinctToggle={handleDistinctToggle}
            showDistinctOptions={showDistinctOptions}
            selectionCount={selectionCount}
            clearAllDistinctColumns={clearAllDistinctColumns}
            selectAllDistinctColumns={selectAllDistinctColumns}
            itemLabelSingular={itemLabelSingular}
            itemLabelPlural={itemLabelPlural}
            availableTables={availableTables}
            activeTableFilter={activeTableFilter}
            onTableFilterChange={setActiveTableFilter}
          />
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 bg-gray-50/80 px-4 sm:px-6 flex-shrink-0">
          <div className="flex gap-4" role="tablist">
            <button
              onClick={() => setActiveTab("all")}
              role="tab"
              aria-selected={activeTab === "all"}
              className={`py-2.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Columns3 className="w-4 h-4" />
                <span>Todas as {itemLabelPlural}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs font-semibold">
                  {filteredTables.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("selected")}
              role="tab"
              aria-selected={activeTab === "selected"}
              className={`py-2.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "selected"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Selecionadas</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                    selectionCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {selectionCount}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* CONTENT LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white min-h-[220px]">
          <RenderTabContent
            showDistinctOptions={enableDistinct && showDistinctOptions && useDistinct}
            distinctColumns={distinctColumns}
            toggleDistinctColumn={toggleDistinctColumn}
            activeTab={activeTab}
            filteredTables={filteredTables}
            filteredSelectedTables={filteredSelectedTables}
            localSelection={localSelection}
            tableAliases={enableAliases ? tableAliases : {}}
            editingAlias={editingAlias}
            handleAliasChange={enableAliases ? handleAliasChange : NOOP}
            startEditingAlias={startEditingAlias}
            finishEditingAlias={finishEditingAlias}
            setEditingAlias={setEditingAlias}
            removeAlias={removeAlias}
            getAliasError={getAliasError}
            toggleTable={toggleTable}
            setActiveTab={setActiveTab}
            itemLabelSingular={itemLabelSingular}
            itemLabelPlural={itemLabelPlural}
            icon={icon}
          />
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            {selectionCount === 0 ? (
              <span className="text-blue-700">
                💡 <strong>Dica:</strong> Nenhuma coluna marcada equivale a <code>SELECT *</code> (todas as colunas).
              </span>
            ) : (
              <span>
                <strong>{selectionCount}</strong> {itemLabelPlural} serão projetadas na consulta.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-gray-700 font-bold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs text-sm"
            >
              {t("actions.cancel") || "Cancelar"}
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidSelection}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>
                {selectionCount === 0 ? "Guardar (Todas as Colunas)" : `Guardar (${selectionCount} ${itemLabelPlural})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}