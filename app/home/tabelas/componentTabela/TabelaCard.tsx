// componentTabela/TableCard.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Loader2,
  Trash2,
  Edit2,
  Square,
} from "lucide-react";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { MetadataTableResponse, TableInfo } from "@/types";
import { DBStructureOut } from "@/types/db-structure";

interface PropsTableCard {
  table: TableInfo;
  tableStructure?: DBStructureOut;
  isExpanded?: boolean;
  isLoadingCols?: boolean;
  toggleTable: (tableName: string) => void;
  colunasShow?: MetadataTableResponse;
  loadingFields: boolean;
  isDarkMode?: boolean;
  seletColunaForTable?: Record<string, Set<string>>;
  setSeleColunaForTable: React.Dispatch<
    React.SetStateAction<Record<string, Set<string>> | undefined>
  >;
  selected?: boolean;
  onToggleSelect?: (tableName: string) => void;
  onRequestEdit?: (tableName: string) => void; // abrir modal de edição
  onRequestDelete?: (tableName: string) => void; // deletar tabela
  onRequestDeleteSelectedColumns?: (tableName: string, columns: string[]) => void; // deletar colunas selecionadas
}

export const TableCard: React.FC<PropsTableCard> = ({
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
  const [copied, setCopied] = useState(false);
  const [selectList, setSelectList] = useState<string[]>(
    Array.from(seletColunaForTable?.[table.name] ?? [])
  );

  // Sincroniza seleção local com o map global
  useEffect(() => {
    setSeleColunaForTable((prev) => ({
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
    const cols = Array.from(seletColunaForTable?.[table.name] ?? new Set<string>());
    if (cols.length === 0) {
      alert("Nenhuma coluna selecionada para remover.");
      return;
    }
    if (!confirm(`Remover ${cols.length} coluna(s) da tabela "${table.name}"? Essa operação é irreversível.`)) return;
    onRequestDeleteSelectedColumns?.(table.name, cols);
  }, [seletColunaForTable, table.name, onRequestDeleteSelectedColumns]);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 hover:shadow-xl ${
        isDarkMode
          ? "bg-gray-800 border-gray-700 hover:border-blue-500/50"
          : "bg-white border-gray-200 hover:border-blue-400"
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Seleção */}
            <button
              onClick={() => onToggleSelect?.(table.name)}
              title={selected ? "Desmarcar tabela" : "Selecionar tabela"}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition ${
                selected ? "bg-blue-500 text-white" : "bg-transparent text-gray-400"
              }`}
            >
              {selected ? <CheckCircle2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            {/* Toggle expand */}
            <button
              onClick={() => toggleTable(table.name)}
              disabled={isLoadingCols}
              className="flex-shrink-0"
              title={isExpanded ? "Recolher detalhes" : "Ver detalhes"}
            >
              {isLoadingCols ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
              )}
            </button>

            {/* Ícone */}
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
              <Database className="w-5 h-5 text-blue-500" />
            </div>

            {/* Nome e descrição */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg truncate">{table.name}</h3>

                <button
                  onClick={copyTableName}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copiar nome da tabela"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>

              {tableStructure?.description && (
                <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {tableStructure.description}
                </p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelectedCols /* () =>onRequestDeleteSelectedColumns?.(table.name, Array.from(seletColunaForTable?.[table.name] ?? new Set())) */}
              className="px-3 py-1 rounded-md text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Eliminar colunas selecionadas"
            >
              Elim. Colunas
            </button>

            <button
              onClick={() => onRequestEdit?.(table.name)}
              className="px-3 py-1 rounded-md text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
              title="Editar tabela"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onRequestDelete?.(table.name)}
              className="px-3 py-1 rounded-md text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Eliminar tabela"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3 mt-3 ml-10">
          {tableStructure?.schema_name && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
              <BookOpen className="w-3 h-3" />
              {tableStructure.schema_name}
            </span>
          )}

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700"}`}>
            <BarChart3 className="w-3 h-3" />
            {table.rowcount >= 0 ? `${table.rowcount.toLocaleString()} registros` : "N/A registros"}
          </span>
        </div>
      </div>

      {/* Colunas (expand) */}
      {isExpanded && (
        <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          {isLoadingCols ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-500" />
              <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Carregando estrutura da tabela...</p>
            </div>
          ) : colunasShow?.colunas ? (
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
            <div className="px-6 py-12 text-center">
              <AlertCircle className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Nenhuma coluna encontrada ou erro ao carregar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(TableCard);
