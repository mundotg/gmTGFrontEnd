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

    // 🔹 NOVOS PARÂMETROS ADICIONADOS (DISTINCT)
    clearAllDistinctColumns?: () => void;
    selectAllDistinctColumns?: () => void;
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
}: TableSearchToolbarProps) {
    const { t } = useI18n();

    const isClearAllDisabled = selectionCount === 0;

    return (
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
            {/* 1. BARRA DE PESQUISA */}
            <div className="relative mb-4 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder={t("modalTable.searchPlaceholder") || "Pesquisar tabelas... (digite para filtrar)"}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm bg-white transition-all outline-none"
                    aria-label={t("modalTable.searchPlaceholder") || "Pesquisar tabelas"}
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

            {/* 2. BOTÕES DE AÇÃO */}
            <div className="flex gap-3 mb-5">
                <button
                    onClick={onSelectAll}
                    disabled={isSelectAllDisabled}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                    <Check className="w-4 h-4" />
                    {t("actions.selectAll") || "Selecionar Todas"} ({selectAllCount})
                </button>
                <button
                    onClick={onClearAll}
                    disabled={isClearAllDisabled}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                >
                    <X className="w-4 h-4" />
                    {t("actions.clearSelection") || "Limpar Seleção"}
                </button>
            </div>

            {/* 3. OPÇÃO DISTINCT */}
            <div className="border-t border-gray-100 pt-4">
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
                        {t("modalTable.useDistinct") || "Usar DISTINCT"}
                    </label>

                    <div className="relative ml-1 flex items-center">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help peer" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                            {t("modalTable.distinctTooltip") || "Remove registros duplicados com base nas colunas selecionadas"}
                        </div>
                    </div>

                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showDistinctOptions ? "rotate-180" : ""}`}
                    />
                </div>

                {/* Mensagem se Distinct ativo mas nada selecionado */}
                {useDistinct && isClearAllDisabled && (
                    <p className="text-xs font-medium text-gray-500 mt-2 ml-6">
                        {t("modalTable.selectToViewColumns") || "Selecione tabelas para ver as colunas disponíveis."}
                    </p>
                )}

                {/* 4. AÇÕES DE COLUNAS DISTINCT (Novos Parâmetros) */}
                {useDistinct && showDistinctOptions && !isClearAllDisabled && (
                    <div className="flex items-center gap-3 mt-3 ml-6">
                        <button
                            onClick={() => selectAllDistinctColumns?.()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                        >
                            {t("actions.selectAllDistinct") || "Selecionar todas as colunas"}
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                            onClick={() => clearAllDistinctColumns?.()}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:underline"
                        >
                            {t("actions.clearDistinct") || "Limpar colunas"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}