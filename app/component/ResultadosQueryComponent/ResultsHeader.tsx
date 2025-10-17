"use client";
import React, { RefObject, useEffect, useRef } from "react";
import { Trash2, X, MoreVertical, Download, AlertTriangle } from "lucide-react";
import { QueryResultType } from "@/types";
import { ConfirmDeleteModalType } from "./types";
import { useCsvExporter } from "@/app/services/relatorio";
import ExportButton from "./ExportButton";

interface ResultsHeaderProps {
  queryResults: QueryResultType;
  isSelectionMode: boolean;
  isDeleting: boolean;
  deleteProgress: number;
  columns: string[];
  headers: {
    name: string;
    type: string;
  }[];
  selectedItems: Set<number>;
  selectedCount: number; // ✅ Nova prop
  isAllSelected: boolean; // ✅ Nova prop
  isSomeSelected: boolean; // ✅ Nova prop
  showMobileMenu: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  setQueryResults: (value: QueryResultType | null) => void;
  toggleSelectionMode: () => void;
  selectAll: () => void;
  clearSelection: () => void; // ✅ Nova prop
  handleDeleteSelection: () => void; // ✅ Nova prop
  setConfirmDelete: (value: ConfirmDeleteModalType) => void;
  setShowMobileMenu: (value: boolean) => void;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  queryResults,
  isSelectionMode,
  isDeleting,
  deleteProgress,
  columns,
  headers,
  // selectedItems,
  selectedCount, // ✅ Nova prop
  isAllSelected, // ✅ Nova prop
  // isSomeSelected, // ✅ Nova prop
  showMobileMenu,
  mobileMenuRef,
  setQueryResults,
  toggleSelectionMode,
  selectAll,
  clearSelection, // ✅ Nova prop
  handleDeleteSelection, // ✅ Nova prop
  setConfirmDelete,
  setShowMobileMenu,
}) => {
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const {
    previewInfo,
    handleExport,
    exportProgress,
    isExporting,
    showExportOptions,
    setShowExportOptions,
  } = useCsvExporter(queryResults.preview, columns, headers);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportOptions(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowExportOptions, setShowMobileMenu, mobileMenuRef]);

  /** 🔹 Desktop Actions */
  const DesktopActions = () => (
    <div className="hidden sm:flex items-center gap-3">
      {/* Toggle Seleção */}
      <button
        onClick={toggleSelectionMode}
        className={`${
          isSelectionMode
            ? "bg-purple-100 text-purple-700 border-purple-200"
            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
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
          {/* Contador de selecionados */}
          {selectedCount > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Selecionar/Desmarcar Todos */}
          <button
            onClick={selectAll}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-all"
            disabled={isDeleting}
          >
            {isAllSelected ? "Desmarcar" : "Selecionar"} Todos
          </button>

          {/* Limpar Seleção */}
          {selectedCount > 0 && (
            <button
              onClick={clearSelection}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-all"
              disabled={isDeleting}
            >
              Limpar
            </button>
          )}

          {/* Eliminar Seleção */}
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelection}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar ({selectedCount})
            </button>
          )}
        </>
      )}

      {/* Eliminar Todos */}
      <button
        onClick={() => setConfirmDelete({ 
          isOpen: true, 
          type: "all", 
          total: queryResults.totalResults || 0,
          lista: [] 
        })}
        disabled={isDeleting || queryResults.preview.length === 0}
        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar Todos
      </button>

      {/* Exportar */}
      <ExportButton
        isExporting={isExporting}
        isDeleting={isDeleting}
        exportProgress={exportProgress}
        showExportOptions={showExportOptions}
        setShowExportOptions={setShowExportOptions}
        handleExport={handleExport}
        exportDropdownRef={exportDropdownRef}
      />

      {/* Fechar */}
      <button
        onClick={() => setQueryResults(null)}
        disabled={isDeleting}
        className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Fechar
      </button>
    </div>
  );

  /** 🔹 Mobile Menu */
  const MobileMenu = () => (
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
            {/* Toggle Seleção */}
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

            {/* Ações de seleção (apenas quando em modo seleção) */}
            {isSelectionMode && (
              <>
                {selectedCount > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-t border-b border-gray-100">
                    {selectedCount} item{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
                  </div>
                )}

                <button
                  onClick={() => {
                    selectAll();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                  disabled={isDeleting}
                >
                  {isAllSelected ? "🗑️ Desmarcar" : "✓ Selecionar"} Todos
                </button>

                {selectedCount > 0 && (
                  <>
                    <button
                      onClick={() => {
                        clearSelection();
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                      disabled={isDeleting}
                    >
                      🗑️ Limpar Seleção
                    </button>

                    <button
                      onClick={() => {
                        handleDeleteSelection();
                        setShowMobileMenu(false);
                      }}
                      disabled={isDeleting}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-red-600 disabled:text-gray-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar ({selectedCount})
                    </button>
                  </>
                )}
              </>
            )}

            {/* Eliminar Todos */}
            <button
              onClick={() => {
                setConfirmDelete({ 
                  isOpen: true, 
                  type: "all", 
                  total: queryResults.totalResults || 0,
                  lista: [] 
                });
                setShowMobileMenu(false);
              }}
              disabled={isDeleting || queryResults.preview.length === 0}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-red-600 disabled:text-gray-400 border-t border-gray-100"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Todos
            </button>

            {/* Exportar */}
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

            {/* Fechar */}
            <button
              onClick={() => {
                setQueryResults(null);
                setShowMobileMenu(false);
              }}
              disabled={isDeleting}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 disabled:text-gray-400 border-t border-gray-100"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        {/* 🔹 Título e Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            Resultados da Consulta
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-medium text-blue-600">
                {queryResults.preview.length.toLocaleString("pt-BR")}
              </span>
              de
              <span className="font-medium">
                {queryResults.totalResults?.toLocaleString("pt-BR") || "..."}
              </span>
              registros
            </span>
            {previewInfo && (
              <span className="hidden sm:inline text-gray-500">
                {previewInfo.columns} colunas • {previewInfo.size}
              </span>
            )}
            {/* Mostrar contador de seleção no desktop quando ativo */}
            {isSelectionMode && selectedCount > 0 && (
              <span className="hidden sm:inline bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* 🔹 Desktop / Mobile */}
        <DesktopActions />
        <MobileMenu />
      </div>

      {/* Mobile Info */}
      {previewInfo && (
        <div className="sm:hidden mt-2 text-sm text-gray-500">
          {previewInfo.columns} colunas • {previewInfo.size}
          {/* Mostrar contador de seleção no mobile quando ativo */}
          {isSelectionMode && selectedCount > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {(isExporting || isDeleting) && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              {isDeleting && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {isExporting ? "Exportando dados..." : "Eliminando registros..."}
            </span>
            <span className="font-medium">
              {isExporting ? exportProgress : deleteProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isExporting ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${isExporting ? exportProgress : deleteProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsHeader;