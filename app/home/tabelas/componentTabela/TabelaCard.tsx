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
  ShieldAlert, // <-- Adicionado novo ícone para as tabelas de sistema
} from "lucide-react";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { MetadataTableResponse, TableInfo } from "@/types";
import { DBStructure } from "@/types/db-structure";
import { useI18n } from "@/context/I18nContext";
import { isSystemTable } from "./util";
import { useSession } from "@/context/SessionContext";

// -----------------------------------------------------------

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
  const { user } = useSession();
  const [copied, setCopied] = useState(false);
  const [auxColunasShow, setAuxColunasShow] = useState<MetadataTableResponse[]>(colunasShow ? [colunasShow] : []);

  // Analisa se a tabela atual é de sistema
  const { isSystem, reason: systemReason } = isSystemTable(table.name, tableStructure?.schema_name);

  // --- NOVA LÓGICA DE ADMIN ---
  // Ajuste "user?.role?.nome === 'admin'" para o formato real do seu sistema.
  const isAdmin = user?.roles?.some(r => r.name === 'admin' || r.name === 'Administrador') || user?.cargo?.position === 'admin';

  // A tabela só fica bloqueada se for de sistema E o user NÃO for admin.
  const isSystemAndNotAdmin = isSystem && !isAdmin;
  // -----------------------------

  useEffect(() => {
    setColunasShow?.(prev => ({
      ...prev,
      [table.name]: auxColunasShow ? auxColunasShow[0] : undefined,
    }));
  }, [auxColunasShow, setColunasShow, table.name]);

  const selectListAsArray = Array.from(seletColunaForTable?.[table.name] ?? []);

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
    if (cols.length === 0 || isSystemAndNotAdmin) return; // Proteção mantida para quem não é admin

    const confirmMessage = t('actions.confirmDeleteCols')
      ? t('actions.confirmDeleteCols').replace('{{count}}', cols.length.toString()).replace('{{table}}', table.name)
      : `Remover ${cols.length} coluna(s) da tabela "${table.name}"?`;

    // Aviso extra se um admin tentar apagar colunas de sistema
    if (isSystem && isAdmin) {
      if (!confirm("⚠️ ATENÇÃO ADMINISTRADOR: Está prestes a apagar colunas de uma TABELA DE SISTEMA. Isto pode quebrar a base de dados. Tem a certeza absoluta?")) return;
    }

    if (!confirm(confirmMessage)) return;

    onRequestDeleteSelectedColumns?.(table.name, cols);
  }, [seletColunaForTable, table.name, onRequestDeleteSelectedColumns, t, isSystemAndNotAdmin, isSystem, isAdmin]);

  const selectedColsCount = seletColunaForTable?.[table.name]?.size ?? 0;

  // Ajuste do estilo: Destaca a vermelho se for sistema. Se for admin, a opacidade não desce tanto (mostra que está ativo)
  const cardBgClass = isSystem
    ? (isDarkMode
      ? `bg-red-900/10 border-red-900/30 ${isAdmin ? '' : 'opacity-75'}`
      : `bg-red-50/50 border-red-200 ${isAdmin ? '' : 'opacity-80'}`)
    : selected
      ? (isDarkMode ? "bg-blue-900/20 border-blue-500/50" : "bg-blue-50 border-blue-300")
      : (isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200");

  return (
    <div
      className={`rounded-xl border shadow-sm transition-all duration-200 ${cardBgClass} ${isExpanded ? "shadow-md" : "hover:shadow-md"} ${isSystemAndNotAdmin ? "cursor-not-allowed" : ""}`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">

          <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
            {/* Checkbox bloqueado apenas se for sistema E não for admin */}
            <button
              disabled={isSystemAndNotAdmin}
              onClick={() => onToggleSelect?.(tableStructure?.schema_name + "." + table.name)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border ${isSystemAndNotAdmin
                ? "bg-gray-100 border-gray-200 text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed"
                : selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    : "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
            >
              {selected ? <CheckCircle2 size={16} /> : <Square size={16} />}
            </button>

            {/* Expansão bloqueada apenas se for sistema E não for admin */}
            <button
              disabled={isSystemAndNotAdmin}
              onClick={() => toggleTable(tableStructure?.schema_name + "." + table.name)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${isSystemAndNotAdmin
                ? "bg-gray-100 border-gray-200 text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed"
                : isDarkMode
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
                <div className={`flex-shrink-0 p-2 rounded-lg ${isSystem
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                  {isSystem ? <ShieldAlert size={18} /> : <Database size={18} />}
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isSystem ? 'text-red-700 dark:text-red-400' : ''}`}>
                    {table.name}
                  </h3>

                  {/* Cópia de nome permitida para admins, mesmo em tabelas de sistema */}
                  {(!isSystem || isAdmin) && (
                    <button
                      onClick={copyTableName}
                      className={`flex-shrink-0 p-1 rounded-md transition-colors ${copied
                        ? "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        }`}
                      title={t("actions.copyName") || "Copiar nome"}
                    >
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  )}

                  {tableStructure?.schema_name && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${isDarkMode
                      ? "bg-gray-800 border-gray-700 text-gray-300"
                      : "bg-gray-100 border-gray-200 text-gray-600"
                      }`}>
                      {tableStructure.schema_name}
                    </span>
                  )}

                  {/* Badge Exclusiva para Informar Sistema - Muda o texto se for Admin */}
                  {isSystem && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${isDarkMode ? "bg-red-900/50 border-red-800 text-red-300" : "bg-red-100 border-red-200 text-red-700"
                      }`}>
                      {isAdmin ? "Tabela de Sistema (Desbloqueada)" : "Bloqueio de Sistema"}
                    </span>
                  )}
                </div>
              </div>

              {/* Descrição padrão ou Razão do bloqueio se for sistema */}
              {isSystem ? (
                <p className={`text-sm mt-1 ml-11 font-medium ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                  Identificado por: {systemReason} {isAdmin && " - Interação permitida (Admin)."}
                </p>
              ) : tableStructure?.description && (
                <p className={`text-sm mt-1 ml-11 line-clamp-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {tableStructure.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 ml-11">
                {/* Esconde linhas apenas para não-admins em tabelas de sistema */}
                {table.rowcount !== undefined && (!isSystem || isAdmin) && (
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-blue-600" />
                    <span className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {table?.rowcount?.toLocaleString()} {t('common.rows') || "linhas"}
                    </span>
                  </div>
                )}
                {colunasShow?.colunas && (!isSystem || isAdmin) && (
                  <div className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {colunasShow.colunas.length} {t('common.columns') || "colunas"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação Bloqueados se for Sistema E NÃO for Admin */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end mt-4 sm:mt-0">
            {selectedColsCount > 0 && (!isSystem || isAdmin) && (
              <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${isDarkMode
                ? "bg-blue-900/30 text-blue-400 border-blue-800"
                : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                {selectedColsCount} {selectedColsCount === 1 ? (t('common.column') || "coluna") : (t('common.columns') || "colunas")}
              </div>
            )}

            <button
              disabled={selectedColsCount === 0 || isSystemAndNotAdmin}
              onClick={handleDeleteSelectedCols}
              className={`p-2 rounded-lg border transition-colors ${selectedColsCount === 0 || isSystemAndNotAdmin
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
              disabled={isSystemAndNotAdmin}
              onClick={() => onRequestEdit?.(table.name)}
              className={`p-2 rounded-lg border transition-colors ${isSystemAndNotAdmin
                ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600"
                : isDarkMode
                  ? "bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 border-amber-900/50"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
                }`}
              title={t("actions.editTable") || "Editar tabela"}
            >
              <Edit2 size={16} />
            </button>

            <button
              disabled={isSystemAndNotAdmin}
              onClick={() => {
                if (isSystem && isAdmin && !confirm("⚠️ ATENÇÃO ADMINISTRADOR: Apagar uma tabela de sistema pode corromper a base de dados. Continuar?")) return;
                onRequestDelete?.(table.name);
              }}
              className={`p-2 rounded-lg border transition-colors ${isSystemAndNotAdmin
                ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600"
                : isDarkMode
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

      {isExpanded && (!isSystem || isAdmin) && (
        <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"} bg-gray-50/50 dark:bg-black/20 rounded-b-xl`}>
          {colunasShow?.colunas ? (
            <div className="p-4 sm:p-6">
              <TableColumnsDisplay
                names_caches_value={{
                  _modal_Create_Open: "_modal_Create_Open_TB" + colunasShow.table_name, _thema: "_thema_tb" + colunasShow.table_name, _modal_Edit_Open: "_modal_Edit_Open_tb" + colunasShow.table_name,
                  consulta_showFilterColunas: "consulta_showFilterColunas_tg" + colunasShow.table_name, consulta_showSortColunas: "consulta_showSortColunas_tg" + colunasShow.table_name
                }}
                tableNames={table.name}
                columns={[colunasShow]}
                setColumns={setAuxColunasShow}
                isLoading={loadingFields}
                setIsLoading={() => { }}
                error={null}
                theme={isDarkMode ? "dark" : "light"}
                tabelaExistenteNaDB={[table.name]}
                showExport
                itemsPerPage={12}
                select={selectListAsArray}
                setSelect={handleColumnsSelectionChange}
              />
            </div>
          ) : (
            <div className={`px-6 py-10 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"
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