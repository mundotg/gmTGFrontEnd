"use client";
import React, { useEffect, useState, useCallback } from "react";
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

interface PropsTableCard {
  table: TableInfo;
  tableStructure?: DBStructure;
  isExpanded?: boolean;
  isLoadingCols?: boolean;
  toggleTable: (tableName: string) => void;
  colunasShow?: MetadataTableResponse;
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

  const [selectList, setSelectList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectList(Array.from(seletColunaForTable?.[table.name] ?? []));
  }, [table.name]);

  useEffect(() => {
    setSeleColunaForTable(prev => ({
      ...(prev ?? {}),
      [table.name]: new Set(selectList),
    }));
  }, [selectList, setSeleColunaForTable, table.name]);

  const copyTableName = useCallback(() => {
    navigator.clipboard.writeText(table.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [table.name]);

  const handleDeleteSelectedCols = useCallback(() => {
    const cols = Array.from(seletColunaForTable?.[table.name] ?? []);
    if (cols.length === 0) return;

    if (!confirm(`Remover ${cols.length} coluna(s) da tabela "${table.name}"?`)) return;

    onRequestDeleteSelectedColumns?.(table.name, cols);
  }, [seletColunaForTable, table.name, onRequestDeleteSelectedColumns]);

  const selectedColsCount = seletColunaForTable?.[table.name]?.size ?? 0;

  return (
    <div 
      className={`rounded-2xl border-2 transition-all duration-300 ${
        selected 
          ? isDarkMode 
            ? "border-blue-500/50 bg-blue-950/20 shadow-lg shadow-blue-500/20" 
            : "border-blue-400/50 bg-blue-50/50 shadow-lg shadow-blue-400/20"
          : isDarkMode 
            ? "border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50" 
            : "border-slate-200/60 bg-white/80 hover:border-slate-300/60"
      } backdrop-blur-xl hover:shadow-2xl ${
        isExpanded ? "shadow-xl" : ""
      }`}
    >
      {/* Header do Card */}
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          
          {/* Lado Esquerdo - Info da Tabela */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox de Seleção */}
            <button
              onClick={() => onToggleSelect?.(table.name)}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                selected 
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-110" 
                  : isDarkMode
                    ? "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              }`}
            >
              {selected ? <CheckCircle2 size={18} /> : <Square size={18} />}
            </button>

            {/* Botão Expandir/Colapsar */}
            <button 
              onClick={() => toggleTable(table.name)}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isDarkMode
                  ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {isLoadingCols ? (
                <Loader2 className="animate-spin text-blue-500" size={18} />
              ) : isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>

            {/* Ícone e Info da Tabela */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg shadow-blue-500/30">
                  <Database className="text-white" size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg truncate">{table.name}</h3>
                    <button
                      onClick={copyTableName}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                        copied
                          ? "bg-green-500 text-white"
                          : isDarkMode
                            ? "hover:bg-slate-700 text-slate-400"
                            : "hover:bg-slate-100 text-slate-500"
                      }`}
                      title="Copiar nome"
                    >
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  {tableStructure?.schema_name && (
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                      isDarkMode 
                        ? "bg-slate-700/50 text-slate-300" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {tableStructure.schema_name}
                    </span>
                  )}
                </div>
              </div>

              {tableStructure?.description && (
                <p className={`text-sm mt-1 ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}>
                  {tableStructure.description}
                </p>
              )}

              {/* Estatísticas */}
              <div className="flex items-center gap-4 mt-3">
                {table.rowcount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-blue-500" />
                    <span className={`text-xs font-semibold ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}>
                      {table.rowcount.toLocaleString()} linhas
                    </span>
                  </div>
                )}
                {colunasShow?.colunas && (
                  <div className={`text-xs font-semibold ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {colunasShow.colunas.length} colunas
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito - Botões de Ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedColsCount > 0 && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                isDarkMode
                  ? "bg-blue-900/30 text-blue-400 border border-blue-500/30"
                  : "bg-blue-100 text-blue-700 border border-blue-300"
              }`}>
                {selectedColsCount} {selectedColsCount === 1 ? "coluna" : "colunas"}
              </div>
            )}

            <button
              disabled={selectedColsCount === 0}
              onClick={handleDeleteSelectedCols}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                selectedColsCount === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:scale-110"
              } ${
                isDarkMode
                  ? "bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 border border-rose-500/30"
                  : "bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-300"
              }`}
              title="Eliminar colunas selecionadas"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => onRequestEdit?.(table.name)}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDarkMode
                  ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-500/30"
                  : "bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-300"
              }`}
              title="Editar tabela"
            >
              <Edit2 size={16} />
            </button>

            <button
              onClick={() => onRequestDelete?.(table.name)}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDarkMode
                  ? "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30"
                  : "bg-red-100 text-red-600 hover:bg-red-200 border border-red-300"
              }`}
              title="Eliminar tabela"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Corpo Expandido - Colunas */}
      {isExpanded && (
        <div className={`border-t-2 ${
          isDarkMode ? "border-slate-700/50" : "border-slate-200/60"
        }`}>
          {colunasShow?.colunas ? (
            <div className="p-6">
              <TableColumnsDisplay
                tableNames={table.name}
                columns={[colunasShow]}
                isLoading={loadingFields}
                setIsLoading={() => {}}
                error={null}
                theme={isDarkMode ? "dark" : "light"}
                tabelaExistenteNaDB={[table.name]}
                showExport
                itemsPerPage={12}
                select={selectList}
                setSelect={setSelectList}
              />
            </div>
          ) : (
            <div className={`px-6 py-12 text-center ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                isDarkMode ? "bg-slate-700/30" : "bg-slate-100"
              }`}>
                <AlertCircle size={32} className="opacity-50" />
              </div>
              <p className="font-semibold">Nenhuma coluna encontrada</p>
              <p className="text-sm mt-1 opacity-70">Esta tabela não possui colunas visíveis</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TableCard.displayName = "TableCard";