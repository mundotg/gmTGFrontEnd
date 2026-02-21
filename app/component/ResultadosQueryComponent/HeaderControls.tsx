"use client";
import React from "react";
import { Search, X, Filter, Eye, EyeOff } from "lucide-react";
import { Header } from "./funcs";
import { useI18n } from "@/context/I18nContext";

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
  const { t } = useI18n();
  const visibleCount = columns.length - hiddenColumns.size;
  
  return (
    <>
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("table.searchColumns") || "Buscar em todas as colunas..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors shadow-sm bg-white placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                title={t("actions.clearSearch") || "Limpar busca"}
                aria-label={t("actions.clearSearch") || "Limpar busca"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Column Manager */}
          <div className="relative">
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className="bg-white border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 whitespace-nowrap h-full"
              title={t("table.manageColumns") || "Gerenciar colunas"}
              aria-label={t("table.manageColumns") || "Gerenciar colunas"}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{t("table.columns") || "Colunas"}</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider ml-1">
                {visibleCount}/{columns.length}
              </span>
            </button>

            {showColumnManager && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <h4 className="font-bold text-gray-900 text-sm">{t("table.manageColumns") || "Gerenciar Colunas"}</h4>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    {visibleCount} {t("common.of") || "de"} {columns.length} {t("table.visibleColumns") || "colunas visíveis"}
                  </p>
                </div>
                
                <div className="overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-200 p-2 space-y-1">
                  {columns.map((column) => {
                    const isVisible = !hiddenColumns.has(column);
                    const columnInfo = headers.find((h) => h.name === column);

                    return (
                      <button
                        key={column}
                        onClick={() => toggleColumnVisibility(column)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isVisible
                            ? "bg-blue-50/50 hover:bg-blue-50 border border-blue-100"
                            : "bg-white hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        {isVisible ? (
                          <div className="bg-blue-600 rounded-md p-1.5 shadow-sm shrink-0">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="bg-gray-100 border border-gray-200 rounded-md p-1.5 shrink-0">
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm truncate ${
                              isVisible ? "font-bold text-gray-900" : "font-medium text-gray-500"
                            }`}
                          >
                            {column}
                          </div>
                          {columnInfo?.type && (
                            <div className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${
                              isVisible ? "text-blue-600" : "text-gray-400"
                            }`}>
                              {columnInfo.type}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
                  <button
                    onClick={() => {
                      columns.forEach(col => {
                        if (hiddenColumns.has(col)) {
                          toggleColumnVisibility(col);
                        }
                      });
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                  >
                    {t("table.showAll") || "Mostrar todas"}
                  </button>
                  <button
                    onClick={() => setShowColumnManager(false)}
                    className="text-xs font-bold bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    {t("actions.close") || "Fechar"}
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