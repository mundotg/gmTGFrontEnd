"use client";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { MetadataTableResponse, QueryResultType, SelectedRow } from "@/types";
import { useCsvExporter } from "../services/relatorio";
import ScrollableTable from "./ScrollableTable";
import api from "@/context/axioCuston";
import { Style_tabela_resultados } from "@/constant";
import { Trash2, Edit, Download, X, MoreVertical, AlertTriangle } from "lucide-react";
import { findIdentifierField } from "@/util/func";
import ConfirmDeleteModal from "./ConfirmDeleteModal"; // Usando o ContextMenu melhorado
import ContextMenu, { ContextMenuAction } from "./ContextMenu_eliminar";

interface ResultTableProps {
  queryResults: QueryResultType;
  columnsInfo?: MetadataTableResponse[];
  setQueryResults: (value: QueryResultType | null) => void;
  setSelectedRow?: (row: SelectedRow) => void;
  selectedRow?: SelectedRow | null;
}

interface ContextMenuState {
  x: number;
  y: number;
  row: Record<string, any>;
  index: number;
}

interface ConfirmDeleteModalType {
  isOpen: boolean;
  type: "single" | "all";
  total?: number;
  row?: any;
  index?: number;
  table?: string[];
}

export default function ResultTable({
  queryResults,
  setQueryResults,
  columnsInfo = [],
  setSelectedRow,
}: ResultTableProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteModalType>({
    isOpen: false,
    type: 'single'
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => Object.keys(queryResults.preview[0] || {}), [queryResults]);
  const headers = useMemo(() => {
    return columns.map((col) => {
      const colParts = col.split(".");
      const columnName = colParts.length > 1 ? colParts.slice(1).join(".") : colParts[0];

      const tipo =
        columnsInfo
          .find((info) =>
            info.colunas.some((c) => c.nome === columnName)
          )
          ?.colunas.find((c) => c.nome === columnName)?.tipo || "unknown";

      return {
        name: col,
        type: tipo,
      };
    });
  }, [columns, columnsInfo]);

  const {
    previewInfo,
    getFilePreview,
    handleExport,
    exportProgress,
    isExporting,
    showExportOptions,
    setShowExportOptions,
  } = useCsvExporter(queryResults.preview, columns, headers);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowExportOptions]);

  // Ações do menu de contexto
  const contextMenuActions: ContextMenuAction[] = useMemo(() => [
    {
      key: "edit",
      label: "Editar Registro",
      icon: <Edit className="w-4 h-4" />,
      className: "text-blue-600 hover:bg-blue-50"
    },
    {
      key: "separator1",
      label: "",
      separator: true
    },
    {
      key: "delete",
      label: "Eliminar Registro",
      icon: <Trash2 className="w-4 h-4" />,
      className: "text-red-600 hover:bg-red-50"
    }
  ], []);

  const eliminarRegistro = useCallback(async (row: Record<string, any>, tabela: string[], index: number) => {
    try {
      setIsDeleting(true);
      setDeleteProgress(0);

      if (tabela.length === 0) {
        throw new Error("Não foi possível identificar a tabela deste registro");
      }

      const primaryKeys = findIdentifierField(tabela[0], columnsInfo);
      if (!primaryKeys) {
        throw new Error("Não foi possível identificar as chaves primárias para este registro");
      }

      setDeleteProgress(25);

      const response = await api.post("/exe/delete_record/", {
        primaryKeys,
        originalQuery: queryResults.QueryPayload
      }, {
        withCredentials: true,
      });

      setDeleteProgress(75);

      if (response.data.success) {
        const newPreview = [...queryResults.preview];
        newPreview.splice(index, 1);

        setQueryResults({
          ...queryResults,
          preview: newPreview,
          totalResults: (queryResults.totalResults || 0) - 1
        });

        setDeleteProgress(100);
        setConfirmDelete({ isOpen: false, type: 'single' });

        // Remover da seleção se estiver selecionado
        const newSelected = new Set(selectedItems);
        newSelected.delete(index);
        setSelectedItems(newSelected);
      } else {
        throw new Error(response.data.message || "Erro ao eliminar registro");
      }
    } catch (error) {
      console.error("Erro ao eliminar registro:", error);
      alert(`Erro ao eliminar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  }, [queryResults, setQueryResults, columnsInfo, selectedItems]);

  const eliminarTodosRegistros = useCallback(async () => {
    try {
      setIsDeleting(true);
      setDeleteProgress(0);

      const response = await api.post("/exe/delete_all_results/", {
        originalQuery: queryResults.QueryPayload
      }, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setDeleteProgress(progress);
        }
      });

      if (response.data.success) {
        setQueryResults({
          ...queryResults,
          preview: [],
          totalResults: 0
        });

        setDeleteProgress(100);
        setConfirmDelete({ isOpen: false, type: 'all' });
        setSelectedItems(new Set());
        setIsSelectionMode(false);
      } else {
        throw new Error(response.data.message || "Erro ao eliminar todos os registros");
      }
    } catch (error) {
      console.error("Erro ao eliminar todos os registros:", error);
      alert(`Erro ao eliminar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  }, [queryResults, setQueryResults]);

  const handleRowClick = useCallback((row: Record<string, any>, index: number) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      setSelectedItems(newSelected);
      return;
    }

    if (!setSelectedRow || !row || typeof index !== "number") return;

    const tabelasAssociadas = new Set<string>();
    Object.keys(row).forEach((campo) => {
      const [tableName] = campo.split(".");
      if (tableName && tableName.trim() !== "") {
        tabelasAssociadas.add(tableName.trim());
      }
    });

    const tabelas = Array.from(tabelasAssociadas);
    setSelectedRow({
      row,
      nameColumns: columns,
      index,
      tableName: tabelas
    });
  }, [setSelectedRow, columns, isSelectionMode, selectedItems]);

  const handleContextMenu = useCallback((
    event: React.MouseEvent,
    row: Record<string, any>,
    index: number
  ) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      row,
      index
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextAction = useCallback((actionKey: string) => {
    if (!contextMenu) return;

    switch (actionKey) {
      case 'edit':
        handleRowClick(contextMenu.row, contextMenu.index);
        break;
      case 'delete':
        setConfirmDelete({
          isOpen: true,
          type: 'single',
          row: contextMenu.row,
          index: contextMenu.index
        });
        break;
    }

    closeContextMenu();
  }, [contextMenu, handleRowClick, closeContextMenu]);

  const carregarMaisLinhas = async () => {
    const query = queryResults.QueryPayload;
    if (!query) return;
    query.offset = queryResults.preview.length;
    query.isCountQuery = false;

    try {
      const { data } = await api.post<QueryResultType>("/exe/execute_query/", query, {
        withCredentials: true,
      });

      if (data.success) {
        setQueryResults({
          ...queryResults,
          preview: [...queryResults.preview, ...data.preview],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mais linhas:', error);
    } finally {
      getFilePreview();
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems(new Set());
  };

  const selectAll = () => {
    if (selectedItems.size === queryResults.preview.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queryResults.preview.map((_, index) => index)));
    }
  };

  const ExportButton = () => (
    <div className="relative" ref={exportDropdownRef}>
      <button
        onClick={() => setShowExportOptions(!showExportOptions)}
        disabled={isExporting || isDeleting}
        className={`${isExporting || isDeleting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
          } text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2 min-w-max`}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="hidden sm:inline">{exportProgress}%</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className={`transform transition-transform ${showExportOptions ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </>
        )}
      </button>

      {showExportOptions && !isExporting && !isDeleting && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Opções de Exportação
            </h4>

            <div className="space-y-1">
              <button
                onClick={() => handleExport('basic')}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border transition-colors"
              >
                <div className="font-medium text-gray-900">📄 Básico</div>
                <div className="text-gray-600 text-sm">CSV padrão, vírgula como separador</div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border transition-colors"
              >
                <div className="font-medium text-gray-900">📊 Excel</div>
                <div className="text-gray-600 text-sm">Otimizado para Excel brasileiro</div>
              </button>

              <button
                onClick={() => handleExport('advanced')}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border transition-colors"
              >
                <div className="font-medium text-gray-900">⚡ Avançado</div>
                <div className="text-gray-600 text-sm">Nomes amigáveis, formatação inteligente</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in" aria-label="Tabela-de-Resultados">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Resultados da Consulta
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-medium text-blue-600">
                  {queryResults.preview.length.toLocaleString('pt-BR')}
                </span>
                de
                <span className="font-medium">
                  {queryResults.totalResults?.toLocaleString('pt-BR') || "..."}
                </span>
                registros
              </span>
              {previewInfo && (
                <span className="hidden sm:inline text-gray-500">
                  {previewInfo.columns} colunas • {previewInfo.size}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Selection Mode Toggle */}
            <button
              onClick={toggleSelectionMode}
              className={`${isSelectionMode
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                } border text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2`}
              disabled={isDeleting}
            >
              <input
                type="checkbox"
                checked={isSelectionMode}
                onChange={() => { }}
                className="w-4 h-4 text-purple-600 rounded border-gray-300"
              />
              Seleção
            </button>

            {isSelectionMode && (
              <>
                <button
                  onClick={selectAll}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-all"
                  disabled={isDeleting}
                >
                  {selectedItems.size === queryResults.preview.length ? 'Desmarcar' : 'Selecionar'} Todos
                </button>

                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    {selectedItems.size} selecionados
                  </span>
                )}
              </>
            )}

            <button
              onClick={() => setConfirmDelete({ isOpen: true, type: 'all' })}
              disabled={isDeleting || queryResults.preview.length === 0}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
              title="Eliminar todos os registros"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Todos
            </button>

            <ExportButton />

            <button
              onClick={() => setQueryResults(null)}
              disabled={isDeleting}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMobileMenu && (
              <div className="absolute right-4 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                <div className="py-2">
                  <button
                    onClick={() => {
                      toggleSelectionMode();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    disabled={isDeleting}
                  >
                    <input
                      type="checkbox"
                      checked={isSelectionMode}
                      onChange={() => { }}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300"
                    />
                    Modo Seleção
                  </button>

                  <button
                    onClick={() => {
                      setConfirmDelete({ isOpen: true, type: 'all' });
                      setShowMobileMenu(false);
                    }}
                    disabled={isDeleting || queryResults.preview.length === 0}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-red-600 disabled:text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Todos
                  </button>

                  <button
                    onClick={() => {
                      setShowExportOptions(true);
                      setShowMobileMenu(false);
                    }}
                    disabled={isExporting || isDeleting}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 disabled:text-gray-400"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>

                  <button
                    onClick={() => {
                      setQueryResults(null);
                      setShowMobileMenu(false);
                    }}
                    disabled={isDeleting}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 disabled:text-gray-400"
                  >
                    <X className="w-4 h-4" />
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Info */}
        {previewInfo && (
          <div className="sm:hidden mt-2 text-sm text-gray-500">
            {previewInfo.columns} colunas • {previewInfo.size}
          </div>
        )}

        {/* Selection Info Mobile */}
        {isSelectionMode && selectedItems.size > 0 && (
          <div className="sm:hidden mt-3 flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-purple-700 font-medium">
              {selectedItems.size} registro{selectedItems.size > 1 ? 's' : ''} selecionado{selectedItems.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {selectedItems.size === queryResults.preview.length ? 'Desmarcar' : 'Selecionar'} Todos
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {(isExporting || isDeleting) && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              {isDeleting && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {isExporting ? 'Exportando dados...' : 'Eliminando registros...'}
            </span>
            <span className="font-medium">{isExporting ? exportProgress : deleteProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isExporting ? 'bg-blue-500' : 'bg-red-500'
                }`}
              style={{ width: `${isExporting ? exportProgress : deleteProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="relative overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
        <ScrollableTable
          columns={columns}
          headers={headers}
          queryResults={queryResults.preview}
          totalFromDb={queryResults.totalResults || 0}
          onLoadMore={carregarMaisLinhas}
          handleRowClick={handleRowClick}
          onContextMenu={handleContextMenu}
          selectedItems={isSelectionMode ? selectedItems : undefined}
          isSelectionMode={isSelectionMode}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onAction={handleContextAction}
          actions={contextMenuActions}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        type={confirmDelete.type}
        total={confirmDelete.total}
        isDeleting={isDeleting}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={() => {
          if (confirmDelete.type === "all") {
            eliminarTodosRegistros();
          } else if (confirmDelete.row && confirmDelete.index !== undefined) {
            eliminarRegistro(
              confirmDelete.row,
              columnsInfo.map(c => c.table_name),
              confirmDelete.index
            );
          }
        }}
      />

      {/* Export Dropdown Mobile Overlay */}
      <div className="sm:hidden">
        <ExportButton />
      </div>

      <style jsx>{Style_tabela_resultados}</style>
    </div>
  );
}