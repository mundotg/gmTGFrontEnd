"use client";
import { FILTER_OPTIONS } from "@/constant";
import { getColumnIcon } from "@/util";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Database } from "lucide-react";
import React from "react";
import { RenderItem } from "./RenderItem";
import { CampoDetalhado } from "@/types";
import { useI18n } from "@/context/I18nContext";

export type FilterOption = { value: string; label: string };

export interface FilterableGridProps<T> {
  data: (CampoDetalhado & {
    tableName: string;
  })[];
  onColumnClick?: (col: CampoDetalhado & { tableName: string }) => void;
  // Busca
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;

  // Filtro
  showFilter?: boolean;
  filterType?: "all" | "primary" | "nullable" | "enum" | "varchar" | "integer" | "datetime";
  onFilterChange?: React.Dispatch<React.SetStateAction<"all" | "primary" | "nullable" | "enum" | "varchar" | "integer" | "datetime">>;
  isColumnSelected: (col: (CampoDetalhado & {
    tableName: string;
  })) => boolean;
  handleColumnClick: (col: CampoDetalhado & { tableName: string }) => void;
  handleColumnSelect: (col: CampoDetalhado & { tableName: string }, event: React.MouseEvent) => void;
  
  // currentTheme removido do uso de design, mas mantido na assinatura para compatibilidade se o componente filho precisar
  currentTheme: "light" | "dark"; 
  
  // Ordenação
  showSort?: boolean;
  sortBy?: string;
  onSortByChange?: React.Dispatch<React.SetStateAction<"nome" | "tipo">>;
  sortOrder?: "asc" | "desc";
  onSortOrderChange?: (value: "asc" | "desc") => void;

  // Seleção
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectAll?: () => void;
  onItemSelect?: (item: T, e?: React.MouseEvent) => void;

  // Paginação
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  // (Obsoleto) themeClasses mantido na interface só para não quebrar componentes pais que enviam ele, mas ignorado no visual interno.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  themeClasses?: any;

  // Estados
  isLoading?: boolean;
  skeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export function FilterableGrid<T extends { nome?: string }>({
  data,
  onColumnClick,
  showSearch = false,
  handleColumnClick,
  handleColumnSelect,
  currentTheme,
  isColumnSelected,
  searchTerm = "",
  onSearchChange,
  showFilter = false,
  filterType,
  onFilterChange,
  showSort = false,
  sortBy,
  onSortByChange,
  sortOrder = "asc",
  onSortOrderChange,
  selectable = false,
  selectedKeys = [],
  themeClasses,
  onSelectAll,
  page = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  skeleton,
  emptyState,
}: FilterableGridProps<T>) {
  const { t } = useI18n();

  return (
    <div className="w-full">
      {/* 🔎 Controles */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('grid.searchPlaceholder') || "Buscar colunas..."}
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {showFilter && (
          <select
            value={filterType}
            onChange={(e) => onFilterChange?.(e.target.value as "all" | "primary" | "nullable" | "enum" | "varchar" | "integer" | "datetime")}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {/* Fallback de tradução para as labels do FILTER_OPTIONS se possível, caso contrário usa a default */}
                {t(`grid.filter_${opt.value}`) || opt.label}
              </option>
            ))}
          </select>
        )}

        {showSort && (
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange?.(e.target.value as "nome" | "tipo")}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none"
            >
              <option value="nome">{t('grid.sortName') || "Nome"}</option>
              <option value="tipo">{t('grid.sortType') || "Tipo"}</option>
            </select>
            <button
              onClick={() => onSortOrderChange?.(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              title={sortOrder === "asc" ? (t('grid.sortDesc') || "Ordenar Descendente") : (t('grid.sortAsc') || "Ordenar Ascendente")}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {selectable && data.length > 0 && (
          <button
            onClick={onSelectAll}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {selectedKeys.length === data.length 
              ? (t('actions.deselectAll') || "Desmarcar todos") 
              : (t('actions.selectAll') || "Selecionar todos")}
          </button>
        )}
      </div>

      {/* 🔲 Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <React.Fragment key={i}>{skeleton}</React.Fragment>
          ))}
        </div>
      ) : data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item, i) => (
            <RenderItem
              key={`${item.tableName}-${item.nome}-${i}`}
              column={item}
              index={i}
              isSelected={isColumnSelected(item)}
              currentTheme={currentTheme}
              themeClasses={themeClasses}
              onColumnClick={onColumnClick}
              handleColumnClick={handleColumnClick}
              handleColumnSelect={handleColumnSelect}
              getColumnIcon={getColumnIcon}
            />
          ))}
        </div>
      ) : (
        emptyState ?? (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
            <Database className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 font-medium">{t('grid.noItems') || "Nenhum item encontrado"}</p>
          </div>
        )
      )}

      {/* ⏩ Paginação */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600">
            {t('grid.page') || "Página"} {page} {t('common.of') || "de"} {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}