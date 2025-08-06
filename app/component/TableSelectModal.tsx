import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Check, Database, Filter, Info, ChevronDown } from "lucide-react";
import { RenderDistinctColumnSelector } from "./renderDistinctColumnSelector";
import { TableListSection } from "./TableListSection";

interface TableSelectModalProps {
  allTables: string[];
  selected: string[];
  onClose: () => void;
  onSave: (tables: string[], distinct: boolean, distinctColumns?: string[]) => void;
  columnMap?: TabelaComColunas[];
}

interface TabelaComColunas {
  table_name: string;
  colunas: Array<{
    nome: string;
    tipo: string;
  }>;
}

export function TableSelectModal({
  allTables,
  selected,
  onClose,
  onSave,
  columnMap = [],
}: TableSelectModalProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selected);
  const [searchTerm, setSearchTerm] = useState("");
  const [useDistinct, setUseDistinct] = useState(false);
  const [distinctColumns, setDistinctColumns] = useState<string[]>([]);
  const [showDistinctOptions, setShowDistinctOptions] = useState(false);

  // Memoized filtered tables para performance
  const filteredTables = useMemo(() => {
    if (!searchTerm) return allTables;
    return allTables.filter((table) =>
      table.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTables, searchTerm]);

  // Memoized columns from selected tables
  const availableColumns = useMemo(() => {
    if (!columnMap.length || !localSelection.length) return [];

    const columnsSet = new Set<string>();
    columnMap
      .filter((t) => localSelection.includes(t.table_name))
      .forEach((t) => {
        t.colunas.forEach((c) => columnsSet.add(c.nome));
      });

    return Array.from(columnsSet).sort();
  }, [columnMap, localSelection]);

  // Validação de seleção
  const isValidSelection = useMemo(() => {
    if (localSelection.length === 0) return false;
    if (useDistinct && availableColumns.length > 0 && distinctColumns.length === 0) return false;
    return true;
  }, [localSelection.length, useDistinct, availableColumns.length, distinctColumns.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValidSelection) {
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isValidSelection]);

  const toggleTable = (table: string) => {
    setLocalSelection((prev) =>
      prev.includes(table)
        ? prev.filter((t) => t !== table)
        : [...prev, table]
    );
  };

  function handleDistinctAdd(e: React.ChangeEvent<HTMLInputElement>, table: string): void {
    if (e.target.checked) {
      setDistinctColumns((prev) => [...prev, table]);
    } else {
      setDistinctColumns((prev) => prev.filter((col) => col !== table));
    }
  }

  const selectAll = () => {
    setLocalSelection(filteredTables);
  };

  const clearAll = () => {
    setLocalSelection([]);
    setUseDistinct(false);
    setDistinctColumns([]);
    setShowDistinctOptions(false);
  };

  const handleDistinctToggle = (checked: boolean) => {
    setUseDistinct(checked);
    if (checked && availableColumns.length > 0) {
      setShowDistinctOptions(true);
    } else {
      setShowDistinctOptions(false);
      setDistinctColumns([]);
    }
  };

  const toggleDistinctColumn = (column: string) => {
    setDistinctColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const selectAllDistinctColumns = () => {
    setDistinctColumns(availableColumns);
  };

  const clearAllDistinctColumns = () => {
    setDistinctColumns([]);
  };

  const handleSave = () => {
    if (!isValidSelection) return;

    const columnsToPass = useDistinct && distinctColumns.length > 0
      ? distinctColumns
      : undefined;

    onSave(localSelection, useDistinct, columnsToPass);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800">
                Selecionar Tabelas
              </h3>
              <p className="text-sm text-gray-500">
                {localSelection.length} de {allTables.length} tabelas selecionadas
                {useDistinct && distinctColumns.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    DISTINCT: {distinctColumns.length} colunas
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-gray-50">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar tabelas... (digite para filtrar)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              disabled={filteredTables.length === 0}
              className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Selecionar Todas ({filteredTables.length})
            </button>
            <button
              onClick={clearAll}
              disabled={localSelection.length === 0}
              className="flex-1 px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar Seleção
            </button>
          </div>

          {/* DISTINCT Option */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useDistinct}
                onChange={(e) => handleDistinctToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Usar DISTINCT</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Remove registros duplicados com base nas colunas selecionadas
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showDistinctOptions ? "rotate-180" : ""
                  }`}
              />
            </label>

            {useDistinct && localSelection.length === 0 && (
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Selecione tabelas para ver as colunas disponíveis.
              </p>
            )}
          </div>
        </div>

        {/* DISTINCT Columns Selection */}
        {showDistinctOptions && availableColumns.length > 0 && <RenderDistinctColumnSelector distinctColumns={distinctColumns} availableColumns={availableColumns} toggleDistinctColumn={toggleDistinctColumn} selectAllDistinctColumns={selectAllDistinctColumns} clearAllDistinctColumns={clearAllDistinctColumns} />}

       <TableListSection
         filteredTables={filteredTables}
         localSelection={localSelection}
         toggleTable={toggleTable}
         useDistinct={useDistinct}
         distinctColumns={distinctColumns}
         handleDistinctAdd={handleDistinctAdd}
         searchTerm={searchTerm}
       />

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
          {/* Validation Messages */}
          {!isValidSelection && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-1">
                <Info className="w-4 h-4" />
                {localSelection.length === 0
                  ? "Selecione pelo menos uma tabela."
                  : "Selecione colunas para DISTINCT ou desative a opção."
                }
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Ctrl+Enter</span> para salvar
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm lg:text-base transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isValidSelection}
                className={`px-6 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors flex items-center gap-2 ${isValidSelection
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <Check className="w-4 h-4" />
                Salvar
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                  {localSelection.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
