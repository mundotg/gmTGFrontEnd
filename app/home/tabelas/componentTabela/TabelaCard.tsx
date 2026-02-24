"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
  Trash2,
  Edit2,
  Square,
  Copy,
  BarChart3,
} from "lucide-react";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { MetadataTableResponse, TableInfo } from "@/types";
import { DBStructure } from "@/types/db-structure";
import { useI18n } from "@/context/I18nContext";

interface PropsTableCard {
  table: TableInfo;
  tableStructure?: DBStructure;
  isExpanded?: boolean;
  isLoadingCols?: boolean;
  toggleTable: (tableName: string) => void;
  colunasShow?: MetadataTableResponse;
  setColunasShow?: React.Dispatch<React.SetStateAction<Record<string, MetadataTableResponse | undefined>>>;
  loadingFields: boolean;
  isDarkMode?: boolean;
  seletColunaForTable?: Record<string, Set<string>>;
  setSeleColunaForTable: React.Dispatch<React.SetStateAction<Record<string, Set<string>> | undefined>>;
  selected?: boolean;
  onToggleSelect?: (tableName: string) => void;
  onRequestEdit?: (tableName: string) => void;
  onRequestDelete?: (tableName: string) => void;
  onRequestDeleteSelectedColumns?: (tableName: string, columns: string[]) => void;
}

export const TableCard: React.FC<PropsTableCard> = React.memo(({
  table,
  tableStructure,
  isExpanded = false,
  isLoadingCols = false,
  toggleTable,
  colunasShow,
  setColunasShow,
  loadingFields,
  isDarkMode = false,
  seletColunaForTable,
  setSeleColunaForTable,
  selected = false,
  onToggleSelect,
  onRequestEdit,
  onRequestDelete,
  onRequestDeleteSelectedColumns,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [auxColunasShow, setAuxColunasShow] = useState< MetadataTableResponse[]>(colunasShow ? [colunasShow] : []);

  useEffect(() => {
    setColunasShow?.(prev => ({
      ...prev,
      [table.name]: auxColunasShow ? auxColunasShow[0] : undefined,
    }));
  }, [auxColunasShow, setColunasShow, table.name]);

  // 1. Derivar o valor diretamente do estado global do pai (sem useEffects!)
  const selectListAsArray = Array.from(seletColunaForTable?.[table.name] ?? []);

  // 2. Criar uma função callback limpa para lidar com mudanças vindas do TableColumnsDisplay
  const handleColumnsSelectionChange = useCallback((newSelectionAsArray: string[]) => {
    setSeleColunaForTable(prev => ({
      ...(prev ?? {}),
      [table.name]: new Set(newSelectionAsArray),
    }));
  }, [setSeleColunaForTable, table.name]);

  const copyTableName = useCallback(() => {
    navigator.clipboard.writeText(table.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [table.name]);

  const handleDeleteSelectedCols = useCallback(() => {
    const cols = Array.from(seletColunaForTable?.[table.name] ?? []);
    if (cols.length === 0) return;

    const confirmMessage = t('actions.confirmDeleteCols') 
      ? t('actions.confirmDeleteCols').replace('{{count}}', cols.length.toString()).replace('{{table}}', table.name)
      : `Remover ${cols.length} coluna(s) da tabela "${table.name}"?`;

    if (!confirm(confirmMessage)) return;

    onRequestDeleteSelectedColumns?.(table.name, cols);
  }, [seletColunaForTable, table.name, onRequestDeleteSelectedColumns, t]);

  const selectedColsCount = seletColunaForTable?.[table.name]?.size ?? 0;

  const cardBgClass = selected 
    ? (isDarkMode ? "bg-blue-900/20 border-blue-500/50" : "bg-blue-50 border-blue-300")
    : (isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200");

  return (
    <div 
      className={`rounded-xl border shadow-sm transition-all duration-200 ${cardBgClass} ${isExpanded ? "shadow-md" : "hover:shadow-md"}`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          
          <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
            <button
              onClick={() => onToggleSelect?.(tableStructure?.schema_name + "." +table.name)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border ${
                selected 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : isDarkMode
                    ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    : "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              {selected ? <CheckCircle2 size={16} /> : <Square size={16} />}
            </button>

            <button 
              onClick={() => toggleTable(tableStructure?.schema_name + "." + table.name)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {isLoadingCols ? (
                <Loader2 className="animate-spin text-blue-600" size={16} />
              ) : isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className={`flex-shrink-0 p-2 rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                  <Database size={18} />
                </div>
                
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <h3 className={`font-bold text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {table.name}
                  </h3>
                  <button
                    onClick={copyTableName}
                    className={`flex-shrink-0 p-1 rounded-md transition-colors ${
                      copied
                        ? "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    }`}
                    title={t("actions.copyName") || "Copiar nome"}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                  
                  {tableStructure?.schema_name && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700 text-gray-300" 
                        : "bg-gray-100 border-gray-200 text-gray-600"
                    }`}>
                      {tableStructure.schema_name}
                    </span>
                  )}
                </div>
              </div>

              {tableStructure?.description && (
                <p className={`text-sm mt-1 ml-11 line-clamp-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {tableStructure.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 ml-11">
                {table.rowcount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-blue-600" />
                    <span className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {table.rowcount.toLocaleString()} {t('common.rows') || "linhas"}
                    </span>
                  </div>
                )}
                {colunasShow?.colunas && (
                  <div className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {colunasShow.colunas.length} {t('common.columns') || "colunas"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end mt-4 sm:mt-0">
            {selectedColsCount > 0 && (
              <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                isDarkMode
                  ? "bg-blue-900/30 text-blue-400 border-blue-800"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {selectedColsCount} {selectedColsCount === 1 ? (t('common.column') || "coluna") : (t('common.columns') || "colunas")}
              </div>
            )}

            <button
              disabled={selectedColsCount === 0}
              onClick={handleDeleteSelectedCols}
              className={`p-2 rounded-lg border transition-colors ${
                selectedColsCount === 0
                  ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600"
                  : isDarkMode
                    ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border-red-900/50"
                    : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              }`}
              title={t("actions.deleteSelectedCols") || "Eliminar colunas selecionadas"}
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => onRequestEdit?.(table.name)}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 border-amber-900/50"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
              }`}
              title={t("actions.editTable") || "Editar tabela"}
            >
              <Edit2 size={16} />
            </button>

            <button
              onClick={() => onRequestDelete?.(table.name)}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-red-900/20 text-red-400 hover:bg-red-900/40 border-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              }`}
              title={t("actions.deleteTable") || "Eliminar tabela"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"} bg-gray-50/50 dark:bg-black/20 rounded-b-xl`}>
          {colunasShow?.colunas ? (
            <div className="p-4 sm:p-6">
              <TableColumnsDisplay
              names_caches_value={ {_modal_Create_Open: "_modal_Create_Open_TB",_thema: "_thema_tb", _modal_Edit_Open:"_modal_Edit_Open_tb", 
                consulta_showFilterColunas: "consulta_showFilterColunas_tg",consulta_showSortColunas:"consulta_showSortColunas_tg"}}
                tableNames={table.name}
                columns={[colunasShow]}
                setColumns={setAuxColunasShow}
                isLoading={loadingFields}
                setIsLoading={() => {}}
                error={null}
                theme={isDarkMode ? "dark" : "light"}
                tabelaExistenteNaDB={[table.name]}
                showExport
                itemsPerPage={12}
                select={selectListAsArray} // <-- Passando o Array
                setSelect={handleColumnsSelectionChange} // <-- Passando a função sem loops
              />
            </div>
          ) : (
            <div className={`px-6 py-10 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}>
                <AlertCircle size={24} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
              </div>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {t('messages.noColumnsFound') || "Nenhuma coluna encontrada"}
              </p>
              <p className="text-sm mt-1">
                {t('messages.noVisibleColumns') || "Esta tabela não possui colunas visíveis"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TableCard.displayName = "TableCard";