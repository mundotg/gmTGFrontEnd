"use client";
import { FILTER_OPTIONS } from "@/constant";
import { getColumnIcon } from "@/util";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Database } from "lucide-react";
import React from "react";
import { RenderItem } from "./RenderItem";
import { CampoDetalhado } from "@/types";

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

    // Temas e classes
    themeClasses: {
        input: string;
        button: string;
        selectButton: string;
        card: string;
        cardSelected: string;
    };

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
    onSelectAll,
    page = 1,
    totalPages = 1,
    onPageChange,
    themeClasses,
    isLoading = false,
    skeleton,
    emptyState,
}: FilterableGridProps<T>) {


    return (
        <div className="w-full">
            {/* 🔎 Controles */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {showSearch && (
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${themeClasses.input}`}
                        />
                    </div>
                )}

                {showFilter && (
                    <select
                        value={filterType}
                        onChange={(e) => onFilterChange?.(e.target.value as "all" | "primary" | "nullable" | "enum" | "varchar" | "integer" | "datetime")}
                        className={`px-4 py-2 rounded-lg border ${themeClasses.input}`}
                    >
                        {FILTER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}

                {showSort && (
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => onSortByChange?.(e.target.value as "nome" | "tipo")}
                            className={`px-4 py-2 rounded-lg border ${themeClasses.input}`}
                        >
                            <option value="nome">Nome</option>
                            <option value="tipo">Tipo</option>
                        </select>
                        <button
                            onClick={() => onSortOrderChange?.(sortOrder === "asc" ? "desc" : "asc")}
                            className={`p-2 rounded-lg ${themeClasses.button}`}
                            title={`Ordenar ${sortOrder === "asc" ? "↓ desc" : "↑ asc"}`}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {selectable && data.length > 0 && (
                    <button
                        onClick={onSelectAll}
                        className={`px-4 py-2 rounded-lg border ${themeClasses.selectButton}`}
                    >
                        {selectedKeys.length === data.length ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                )}
            </div>

            {/* 🔲 Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <React.Fragment key={i}>{skeleton}</React.Fragment>
                    ))}
                </div>
            ) : data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {data.map((item, i) => <RenderItem
                        key={i}
                        column={item}
                        index={i}
                        isSelected={isColumnSelected(item)}
                        currentTheme={currentTheme}
                        themeClasses={themeClasses}
                        onColumnClick={onColumnClick}
                        handleColumnClick={handleColumnClick}
                        handleColumnSelect={handleColumnSelect}
                        getColumnIcon={getColumnIcon}
                    />)}
                </div>
            ) : (
                emptyState ?? (
                    <div className="text-center py-8 opacity-75">
                        <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum item encontrado</p>
                    </div>
                )
            )}

            {/* ⏩ Paginação */}
            {totalPages > 1 && !isLoading && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => onPageChange?.(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`p-2 rounded-lg disabled:opacity-50 ${themeClasses.button}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm opacity-75">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className={`p-2 rounded-lg disabled:opacity-50 ${themeClasses.button}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
