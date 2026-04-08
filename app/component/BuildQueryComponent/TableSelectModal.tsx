"use client"
import React, { useCallback } from "react";
import { X, Check, List } from "lucide-react";
import { RenderTabContent } from "./selectTableModalComponent/RenderTabContent";
import { useI18n } from "@/context/I18nContext";
import { useTableSelect } from '@/hook/useTableSelect';
import { TableSearchToolbar } from "./selectTableModalComponent/TableSearchToolbar";

// Função vazia fora do componente para evitar re-renderizações desnecessárias
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
  db_type_on?: string; // Para customizar mensagens de acordo com o tipo de banco, ex: "colunas" vs "campos"
  selectedItems: string[];
  subItemsMap?: ItemWithSubItems[];
  initialAliases?: Record<string, string>;
  onClose: () => void;
  onSave: (items: string[], useDistinct: boolean, distinctSubItems?: string[], aliases?: Record<string, string>) => void;
  enableDistinct?: boolean;
  enableAliases?: boolean;
  useDistinct?: boolean; // Para controlar o estado do DISTINCT de fora, se necessário
  title?: string;
  tableSelected?: string[]; // Para passar a tabela selecionada e mostrar as colunas disponíveis para DISTINCT
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
  title = "Selecionar Itens",
  itemLabelSingular = "item",
  itemLabelPlural = "itens",
  icon = <List className="w-5 h-5 text-blue-600" />,
}: GenericSelectModalProps) {

  const { t } = useI18n();



  const {
    localSelection, searchTerm, useDistinct, activeTab, tableAliases,
    distinctColumns, showDistinctOptions, editingAlias,
    filteredTables, filteredSelectedTables, isValidSelection,
    setSearchTerm, toggleTable, handleSave, selectAll, clearAll, setActiveTab,
    handleDistinctToggle, toggleDistinctColumn, selectAllDistinctColumns,
    clearAllDistinctColumns, handleAliasChange, startEditingAlias,
    finishEditingAlias, setEditingAlias, removeAlias
  } = useTableSelect({
    propUseDistinct,
    allTables: items,
    selected: selectedItems,
    tableSelected,
    onClose,
    onSave,
    columnMap: subItemsMap as any,
    initialAliases
  });

  const getAliasError = useCallback((alias: string): string | null => {
    if (!alias.trim()) return null;
    const trimmedAlias = alias.trim();
    if (!ALIAS_REGEX.test(trimmedAlias)) return t("modal.invalidAlias") || 'Inválido';

    const otherAliases = Object.entries(tableAliases)
      .filter(([table]) => table !== editingAlias)
      .map(([, a]) => a.trim())
      .filter(a => a);

    if (otherAliases.includes(trimmedAlias)) return t("modal.duplicateAlias") || 'Duplicado';
    return null;
  }, [tableAliases, editingAlias, t]);


  const selectionCount = localSelection.length;
  const distinctCount = distinctColumns.length;
  const aliasCount = Object.values(tableAliases).filter(alias => alias.trim()).length;

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose} // 🔹 FECHAR AO CLICAR FORA
    >
      <div
        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro da modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* HEADER GENÉRICO */}
        <div className="flex items-center justify-between p-4 lg:p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl h-[15%]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg border border-blue-200 shadow-sm">
              {icon}
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
              <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 font-medium mt-0.5">
                <span>{selectionCount} {t("common.of") || "de"} {items.length} {itemLabelPlural} {t("modal.selectedPlural") || "selecionados"}</span>

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

        <TableSearchToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectAll={selectAll}
          onClearAll={clearAll}
          selectAllCount={activeTab === 'all' ? filteredTables.length : items.length}
          isSelectAllDisabled={(activeTab === 'all' ? filteredTables : items).length === 0}
          useDistinct={enableDistinct ? useDistinct : false}
          onDistinctToggle={handleDistinctToggle}
          showDistinctOptions={showDistinctOptions}
          selectionCount={selectionCount}
          clearAllDistinctColumns={clearAllDistinctColumns}
          selectAllDistinctColumns={selectAllDistinctColumns}
        />

        {/* TABS GENÉRICAS */}
        <div className="border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex gap-4" role="tablist">
            <button
              onClick={() => setActiveTab('all')}
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <div className="flex items-center gap-2">
                {icon} {t("modal.all") || "Todos os"} {itemLabelPlural}
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs">{filteredTables.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              role="tab"
              aria-selected={activeTab === 'selected'}
              className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'selected' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {t("modal.selected") || "Selecionados"}
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'selected' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                  {selectionCount}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white h-[75%]">
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

            // 👈 ADICIONAR ESTAS 3 LINHAS:
            itemLabelSingular={itemLabelSingular}
            itemLabelPlural={itemLabelPlural}
            icon={icon}
          />
        </div>

        {/* FOOTER */}
        <div className="p-4 lg:p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 h-[10%]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 font-bold bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t("actions.cancel") || "Cancelar"}
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidSelection}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" /> {t("actions.save") || "Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
}