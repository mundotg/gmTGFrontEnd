"use client";
import React from "react";
import { Search, X, Filter, Eye, EyeOff } from "lucide-react";
import { Header } from "./funcs";

interface HeaderControlsProps {
  search: string;
  setSearch: (value: string) => void;
  showColumnManager: boolean;
  setShowColumnManager: (value: boolean) => void;
  columns: string[];
  hiddenColumns: Set<string>;
  headers: Header[];
  toggleColumnVisibility: (column: string) => void;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  search,
  setSearch,
  showColumnManager,
  setShowColumnManager,
  columns,
  hiddenColumns,
  headers,
  toggleColumnVisibility,
}) => {
  const visibleCount = columns.length - hiddenColumns.size;
  
  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar em todas as colunas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 border-2 border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-100 rounded"
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Column Manager */}
          <div className="relative">
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className="bg-white border-2 border-blue-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
              title="Gerenciar colunas"
              aria-label="Gerenciar colunas"
            >
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Colunas</span>
              <span className="hidden sm:inline bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                {visibleCount}/{columns.length}
              </span>
            </button>

            {showColumnManager && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-blue-200 rounded-lg shadow-xl z-20 max-h-96 overflow-hidden">
                <div className="p-4 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-white">
                  <h4 className="font-bold text-blue-900 text-base">Gerenciar Colunas</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    {visibleCount} de {columns.length} colunas visíveis
                  </p>
                </div>
                
                <div className="overflow-y-auto max-h-80 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-track]:bg-blue-50">
                  <div className="p-2 space-y-1">
                    {columns.map((column) => {
                      const isVisible = !hiddenColumns.has(column);
                      const columnInfo = headers.find((h) => h.name === column);

                      return (
                        <button
                          key={column}
                          onClick={() => toggleColumnVisibility(column)}
                          className={`w-full text-left px-3 py-3 text-sm rounded-lg flex items-center gap-3 transition-all ${
                            isVisible
                              ? "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                              : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          {isVisible ? (
                            <div className="bg-blue-500 rounded p-1">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="bg-gray-300 rounded p-1">
                              <EyeOff className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-semibold truncate ${
                                isVisible ? "text-blue-900" : "text-gray-500"
                              }`}
                            >
                              {column}
                            </div>
                            {columnInfo?.type && (
                              <div className={`text-xs truncate mt-0.5 ${
                                isVisible ? "text-blue-600" : "text-gray-400"
                              }`}>
                                {columnInfo.type}
                              </div>
                            )}
                          </div>
                          {isVisible && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 border-t-2 border-blue-100 bg-gradient-to-r from-white to-blue-50 flex justify-between items-center">
                  <button
                    onClick={() => {
                      columns.forEach(col => {
                        if (hiddenColumns.has(col)) {
                          toggleColumnVisibility(col);
                        }
                      });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Mostrar todas
                  </button>
                  <button
                    onClick={() => setShowColumnManager(false)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para fechar o modal ao clicar fora */}
      {showColumnManager && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowColumnManager(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default HeaderControls;