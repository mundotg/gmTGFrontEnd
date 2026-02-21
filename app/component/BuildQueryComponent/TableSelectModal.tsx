"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Search, Check, Database, Info, ChevronDown } from "lucide-react";
import { RenderDistinctColumnSelector } from "../renderDistinctColumnSelector";
import { RenderTabContent } from "./selectTableModalComponent/RenderTabContent";
import { useI18n } from "@/context/I18nContext";

interface TableSelectModalProps {
  allTables: string[];
  selected: string[];
  onClose: () => void;
  onSave: (tables: string[], distinct: boolean, distinctColumns?: string[], aliases?: Record<string, string>) => void;
  columnMap?: TabelaComColunas[];
  initialAliases?: Record<string, string>;
}

interface TabelaComColunas {
  table_name: string;
  colunas: Array<{
    nome: string;
    tipo: string;
  }>;
}

type TabType = 'all' | 'selected';

// Regex para validação de alias - movido para constante reutilizável
const ALIAS_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function TableSelectModal({
  allTables,
  selected,
  onClose,
  onSave,
  columnMap = [],
  initialAliases = {},
}: TableSelectModalProps) {
  const { t } = useI18n();
  const [localSelection, setLocalSelection] = useState<string[]>(selected);
  const [searchTerm, setSearchTerm] = useState("");
  const [useDistinct, setUseDistinct] = useState(false);
  const [distinctColumns, setDistinctColumns] = useState<string[]>([]);
  const [showDistinctOptions, setShowDistinctOptions] = useState(false);
  const [tableAliases, setTableAliases] = useState<Record<string, string>>(initialAliases);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [editingAlias, setEditingAlias] = useState<string | null>(null);

  // Memoized filtered tables para performance
  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return allTables;
    const term = searchTerm.toLowerCase();
    return allTables.filter((table) => table.toLowerCase().includes(term));
  }, [allTables, searchTerm]);

  // Filtered selected tables for search
  const filteredSelectedTables = useMemo(() => {
    if (!searchTerm.trim()) return localSelection;
    const term = searchTerm.toLowerCase();
    return localSelection.filter((table) => table.toLowerCase().includes(term));
  }, [localSelection, searchTerm]);

  // Memoized columns from selected tables - versão otimizada
  const availableColumns = useMemo(() => {
    if (!columnMap.length || !localSelection.length) return [];

    const selectedTablesSet = new Set(localSelection);
    const columnsSet = new Set<string>();

    columnMap.forEach((table) => {
      if (selectedTablesSet.has(table.table_name)) {
        table.colunas.forEach((coluna) => columnsSet.add(coluna.nome));
      }
    });

    return Array.from(columnsSet).sort();
  }, [columnMap, localSelection]);

  const isValidSelection = useMemo(() => {
    // Validação básica de seleção
    if (localSelection.length === 0) return false;

    // Validação DISTINCT
    if (useDistinct && availableColumns.length > 0 && distinctColumns.length === 0) {
      return false;
    }

    // Validação de aliases
    const aliasEntries = Object.entries(tableAliases);
    const usedAliases = new Set<string>();

    for (const [, alias] of aliasEntries) {
      const trimmedAlias = alias.trim();

      // Pular aliases vazios
      if (!trimmedAlias) continue;

      // Validar formato do alias
      if (!ALIAS_REGEX.test(trimmedAlias)) {
        return false;
      }

      // Validar duplicatas
      if (usedAliases.has(trimmedAlias)) {
        return false;
      }
      usedAliases.add(trimmedAlias);
    }

    return true;
  }, [
    localSelection.length,
    useDistinct,
    availableColumns.length,
    distinctColumns.length,
    JSON.stringify(tableAliases) 
  ]);

  // Handler de save otimizado
  const handleSave = useCallback(() => {
    if (!isValidSelection) return;

    // Preparar dados para envio
    const columnsToPass = useDistinct && distinctColumns.length > 0 ? distinctColumns : undefined;

    // Filtrar aliases válidos
    const validAliases: Record<string, string> = {};
    localSelection.forEach(table => {
      const alias = tableAliases[table]?.trim();
      if (alias && ALIAS_REGEX.test(alias)) {
        validAliases[table] = alias;
      }
    });

    const aliasesToPass = Object.keys(validAliases).length > 0 ? validAliases : undefined;

    onSave(localSelection, useDistinct, columnsToPass, aliasesToPass);
    onClose();
  }, [localSelection, useDistinct, distinctColumns, tableAliases, onSave, onClose, isValidSelection]);

  // Keyboard shortcuts - useEffect otimizado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (editingAlias) {
          setEditingAlias(null);
        } else {
          onClose();
        }
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValidSelection) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isValidSelection, handleSave, editingAlias]);

  // Toggle table com cleanup otimizado
  const toggleTable = useCallback((table: string) => {
    setLocalSelection((prev) => {
      const isCurrentlySelected = prev.includes(table);
      const newSelection = isCurrentlySelected
        ? prev.filter((t) => t !== table)
        : [...prev, table];

      // Cleanup para tabelas desmarcadas
      if (isCurrentlySelected) {
        setTableAliases(prevAliases => {
          const { [table]: removed, ...rest } = prevAliases;
          console.log(removed);
          return rest;
        });

        // Reset DISTINCT se não há mais tabelas
        if (newSelection.length === 0) {
          setUseDistinct(false);
          setDistinctColumns([]);
          setShowDistinctOptions(false);
        }
      }

      return newSelection;
    });
  }, []);

  // Handlers otimizados com useCallback
  const selectAll = useCallback(() => {
    const tablesToSelect = activeTab === 'all' ? filteredTables : allTables;
    setLocalSelection(Array.from(new Set([...localSelection, ...tablesToSelect])));
  }, [activeTab, filteredTables, allTables, localSelection]);

  const clearAll = useCallback(() => {
    setLocalSelection([]);
    setUseDistinct(false);
    setDistinctColumns([]);
    setShowDistinctOptions(false);
    setTableAliases({});
    setEditingAlias(null);
  }, []);

  const handleDistinctToggle = useCallback((checked: boolean) => {
    setUseDistinct(checked);
    if (checked && availableColumns.length > 0) {
      setShowDistinctOptions(true);
    } else {
      setShowDistinctOptions(false);
      setDistinctColumns([]);
    }
  }, [availableColumns.length]);

  const toggleDistinctColumn = useCallback((column: string) => {
    setDistinctColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  }, []);

  const selectAllDistinctColumns = useCallback(() => {
    setDistinctColumns([...availableColumns]);
  }, [availableColumns]);

  const clearAllDistinctColumns = useCallback(() => {
    setDistinctColumns([]);
  }, []);

  const handleAliasChange = useCallback((tableName: string, alias: string) => {
    setTableAliases(prev => ({
      ...prev,
      [tableName]: alias
    }));
  }, []);

  const startEditingAlias = useCallback((tableName: string) => {
    setEditingAlias(tableName);

    // Gerar alias padrão apenas se não existir
    setTableAliases(prev => {
      if (prev[tableName]) return prev;

      const firstLetter = tableName.charAt(0).toLowerCase();
      const existingAliases = new Set(Object.values(prev));
      let counter = 1;
      let newAlias = `${firstLetter}${counter}`;

      while (existingAliases.has(newAlias)) {
        counter++;
        newAlias = `${firstLetter}${counter}`;
      }

      return { ...prev, [tableName]: newAlias };
    });
  }, []);

  const finishEditingAlias = useCallback(() => {
    setEditingAlias(null);
  }, []);

  const removeAlias = useCallback((tableName: string) => {
    setTableAliases(prev => {
      const { [tableName]: removed, ...rest } = prev;
      console.log(removed);
      return rest;
    });
  }, []);

  // Validação de alias individual
  const getAliasError = useCallback((alias: string): string | null => {
    if (!alias.trim()) return null;

    const trimmedAlias = alias.trim();

    if (!ALIAS_REGEX.test(trimmedAlias)) {
      return t("modalTable.invalidAlias") || 'Apenas letras, números e _ (não pode começar com número)';
    }

    // Verificar duplicatas
    const otherAliases = Object.entries(tableAliases)
      .filter(([table]) => table !== editingAlias)
      .map(([, alias]) => alias.trim())
      .filter(alias => alias);

    if (otherAliases.includes(trimmedAlias)) {
      return t("modalTable.duplicateAlias") || 'Alias duplicado';
    }

    return null;
  }, [tableAliases, editingAlias, t]);

  // Contadores para display
  const selectionCount = localSelection.length;
  const distinctCount = distinctColumns.length;
  const aliasCount = Object.values(tableAliases).filter(alias => alias.trim()).length;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label={t("modalTable.title") || "Modal de Seleção de Tabelas"}
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg border border-blue-200 shadow-sm" aria-hidden="true">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {t("modalTable.title") || "Selecionar Tabelas"}
              </h2>
              <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 font-medium mt-0.5">
                <span>{selectionCount} {t("common.of") || "de"} {allTables.length} {t("modalTable.tablesSelected") || "tabelas selecionadas"}</span>
                {useDistinct && distinctCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold tracking-wider">
                    DISTINCT: {distinctCount}
                  </span>
                )}
                {aliasCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-bold tracking-wider">
                    ALIAS: {aliasCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label={t("actions.close") || "Fechar modal"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("modalTable.searchPlaceholder") || "Pesquisar tabelas... (digite para filtrar)"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm bg-white transition-all outline-none"
              aria-label={t("modalTable.searchPlaceholder") || "Pesquisar tabelas"}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={t("actions.clear") || "Limpar pesquisa"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3 mb-5">
            <button
              onClick={selectAll}
              disabled={(activeTab === 'all' ? filteredTables : allTables).length === 0}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
            >
              <Check className="w-4 h-4" />
              {t("actions.selectAll") || "Selecionar Todas"} ({activeTab === 'all' ? filteredTables.length : allTables.length})
            </button>
            <button
              onClick={clearAll}
              disabled={selectionCount === 0}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-red-500/50 outline-none"
            >
              <X className="w-4 h-4" />
              {t("actions.clearSelection") || "Limpar Seleção"}
            </button>
          </div>

          {/* DISTINCT Option */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer w-fit group">
              <input
                type="checkbox"
                checked={useDistinct}
                onChange={(e) => handleDistinctToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={selectionCount === 0}
              />
              <span className={`text-sm font-bold ${selectionCount === 0 ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600 transition-colors'}`}>
                {t("modalTable.useDistinct") || "Usar DISTINCT"}
              </span>
              <div className="relative ml-1">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                  {t("modalTable.distinctTooltip") || "Remove registros duplicados com base nas colunas selecionadas"}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showDistinctOptions ? "rotate-180" : ""}`}
              />
            </label>

            {useDistinct && selectionCount === 0 && (
              <p className="text-xs font-medium text-gray-500 mt-2 ml-6">
                {t("modalTable.selectToViewColumns") || "Selecione tabelas para ver as colunas disponíveis."}
              </p>
            )}
          </div>
        </div>

        {/* DISTINCT Columns Selection */}
        {showDistinctOptions && availableColumns.length > 0 && (
          <RenderDistinctColumnSelector
            distinctColumns={distinctColumns}
            availableColumns={availableColumns}
            toggleDistinctColumn={toggleDistinctColumn}
            selectAllDistinctColumns={selectAllDistinctColumns}
            clearAllDistinctColumns={clearAllDistinctColumns}
          />
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex gap-4" role="tablist">
            <button
              onClick={() => setActiveTab('all')}
              role="tab"
              aria-selected={activeTab === 'all'}
              aria-controls="all-tables-tab"
              className={`py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                {t("modalTable.tabAll") || "Todas as Tabelas"}
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs">
                  {filteredTables.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              role="tab"
              aria-selected={activeTab === 'selected'}
              aria-controls="selected-tables-tab"
              className={`py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'selected'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t("modalTable.tabSelected") || "Selecionadas"}
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'selected' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                  {selectionCount}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white">
          <RenderTabContent
            activeTab={activeTab}
            filteredTables={filteredTables}
            filteredSelectedTables={filteredSelectedTables}
            localSelection={localSelection}
            tableAliases={tableAliases}
            editingAlias={editingAlias}
            toggleTable={toggleTable}
            handleAliasChange={handleAliasChange}
            startEditingAlias={startEditingAlias}
            finishEditingAlias={finishEditingAlias}
            setEditingAlias={setEditingAlias}
            removeAlias={removeAlias}
            getAliasError={getAliasError}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          
          {/* Validation Messages */}
          {!isValidSelection && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {selectionCount === 0
                  ? (t("modalTable.errSelectTable") || "Selecione pelo menos uma tabela.")
                  : useDistinct && availableColumns.length > 0 && distinctColumns.length === 0
                    ? (t("modalTable.errSelectDistinct") || "Selecione colunas para DISTINCT ou desative a opção.")
                    : (t("modalTable.errFixAliases") || "Corrija os erros nos aliases.")
                }
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs font-medium text-gray-500 hidden sm:block">
              <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded font-mono text-gray-700 mr-1">Ctrl</kbd> + 
              <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded font-mono text-gray-700 mx-1">Enter</kbd> 
              {t("actions.toSave") || "para salvar"}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-gray-700 font-bold bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors focus:ring-2 focus:ring-gray-300 outline-none shadow-sm"
              >
                {t("actions.cancel") || "Cancelar"}
              </button>
              <button
                onClick={handleSave}
                disabled={!isValidSelection}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500/50 outline-none ${
                  isValidSelection
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
                {t("actions.save") || "Salvar"}
                {isValidSelection && selectionCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 border border-blue-400 text-white rounded-md text-[10px]">
                    {selectionCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}