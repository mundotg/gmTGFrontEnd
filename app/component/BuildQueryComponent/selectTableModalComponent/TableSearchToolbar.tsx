import React from "react";
import { Search, X, Check, Info, ChevronDown } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export interface TableSearchToolbarProps {
    // Pesquisa
    searchTerm: string;
    onSearchChange: (value: string) => void;

    // Ações (Selecionar / Limpar)
    onSelectAll: () => void;
    onClearAll: () => void;
    selectAllCount: number;
    isSelectAllDisabled: boolean;

    // Distinct
    useDistinct: boolean;
    onDistinctToggle: (checked: boolean) => void;
    showDistinctOptions: boolean;
    selectionCount: number;

    // Ações Distinct
    clearAllDistinctColumns?: () => void;
    selectAllDistinctColumns?: () => void;

    // Custom Labels & Table Chips
    itemLabelSingular?: string;
    itemLabelPlural?: string;
    availableTables?: string[];
    activeTableFilter?: string | null;
    onTableFilterChange?: (table: string | null) => void;
}

export function TableSearchToolbar({
    clearAllDistinctColumns,
    selectAllDistinctColumns,
    searchTerm,
    onSearchChange,
    onSelectAll,
    onClearAll,
    selectAllCount,
    isSelectAllDisabled,
    useDistinct,
    onDistinctToggle,
    showDistinctOptions,
    selectionCount,
    itemLabelSingular = "coluna",
    itemLabelPlural = "colunas",
    availableTables = [],
    activeTableFilter = null,
    onTableFilterChange,
}: TableSearchToolbarProps) {
    const { t } = useI18n();

    const isClearAllDisabled = selectionCount === 0;

    return (
        <div className="p-4 lg:px-6 lg:py-4 border-b border-gray-200 bg-white">
            {/* 1. BARRA DE PESQUISA */}
            <div className="relative mb-3 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder={`Pesquisar ${itemLabelPlural.toLowerCase()}... (ex: nome, id, tabela.coluna)`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm bg-white transition-all outline-none"
                    aria-label={`Pesquisar ${itemLabelPlural}`}
                />
                {searchTerm && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none transition-colors"
                        aria-label={t("actions.clear") || "Limpar pesquisa"}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* 2. CHIPS DE FILTRO POR TABELA (se houver mais de uma tabela) */}
            {availableTables.length > 1 && onTableFilterChange && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3 text-xs">
                    <span className="text-gray-500 font-semibold mr-1">Tabela:</span>
                    <button
                        onClick={() => onTableFilterChange(null)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                            activeTableFilter === null
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Todas
                    </button>
                    {availableTables.map((tbl) => (
                        <button
                            key={tbl}
                            onClick={() => onTableFilterChange(activeTableFilter === tbl ? null : tbl)}
                            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                activeTableFilter === tbl
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {tbl}
                        </button>
                    ))}
                </div>
            )}

            {/* 3. BOTÕES DE AÇÃO */}
            <div className="flex gap-2.5 mb-3">
                <button
                    onClick={onSelectAll}
                    disabled={isSelectAllDisabled}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                    <Check className="w-3.5 h-3.5" />
                    <span>Selecionar Todas</span>
                    <span className="text-gray-400 font-normal">({selectAllCount})</span>
                </button>
                <button
                    onClick={onClearAll}
                    disabled={isClearAllDisabled}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar Seleção</span>
                </button>
            </div>

            {/* 4. OPÇÃO DISTINCT */}
            <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 w-fit group">
                    <input
                        id="distinct-checkbox"
                        type="checkbox"
                        checked={useDistinct}
                        onChange={(e) => onDistinctToggle(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        disabled={isClearAllDisabled}
                    />
                    <label
                        htmlFor="distinct-checkbox"
                        className={`text-sm font-bold cursor-pointer ${isClearAllDisabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600 transition-colors'}`}
                    >
                        {t("modalTable.useDistinct") || "Usar DISTINCT (Eliminar duplicados)"}
                    </label>

                    <div className="relative ml-1 flex items-center">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help peer" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                            Remove linhas com valores idênticos na consulta SQL
                        </div>
                    </div>

                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showDistinctOptions ? "rotate-180" : ""}`}
                    />
                </div>

                {/* Mensagem se Distinct ativo mas nada selecionado */}
                {useDistinct && isClearAllDisabled && (
                    <p className="text-xs font-medium text-amber-600 mt-1.5 ml-6">
                        Selecione pelo menos uma {itemLabelSingular} para aplicar o DISTINCT.
                    </p>
                )}

                {/* AÇÕES DE COLUNAS DISTINCT */}
                {useDistinct && showDistinctOptions && !isClearAllDisabled && (
                    <div className="flex items-center gap-3 mt-2 ml-6 text-xs">
                        <button
                            onClick={() => selectAllDistinctColumns?.()}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                        >
                            Selecionar todas as colunas no DISTINCT
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => clearAllDistinctColumns?.()}
                            className="font-semibold text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:underline"
                        >
                            Limpar colunas do DISTINCT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}