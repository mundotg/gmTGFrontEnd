"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Search, Check, Key, RefreshCw, AlertCircle, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFetch } from "../services/useFetch";
import { ForeignKeyOption, QueryResultType } from "@/types";
import { mapToForeignKeyOptions } from "@/util/func";

interface ForeignKeySelectProps {
    referencedTable: string;
    referencedField: string;
    value: string;
    onChange: (value: string, option: ForeignKeyOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    allowClear?: boolean;
    maxHeight?: number;
    searchPlaceholder?: string;
}

export function ForeignKeySelect({
    referencedTable,
    referencedField,
    value,
    onChange,
    placeholder = "Escolha uma opção...",
    disabled = false,
    required = false,
    error,
    className = "",
    allowClear = false,
    maxHeight = 256,
    searchPlaceholder = "Buscar...",
}: ForeignKeySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [page, setPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    const limit = 50;
    const offset = (page - 1) * limit;

    const searchRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // 🔹 Configuração dinâmica da requisição
    const fetchConfig = useMemo(() => ({
        initialData: {} as QueryResultType,
        method: "POST" as const,
        body: {
            baseTable: referencedTable,
            select: [],
            table_list: [referencedTable],
            joins: {},
            where: search
                ? [{
                    table: referencedTable,
                    column: referencedField,
                    operator: "ILIKE",
                    value: `%${search}%`
                }]
                : [],
            limit,
            offset
        },
        config: { withCredentials: true }
    }), [referencedTable, referencedField, search, page]);

    const {
        data,
        loading,
        error: fetchError,
        refetch
    } = useFetch<QueryResultType>(`/exe/execute_query/`, fetchConfig);

    // 🔹 Atualiza o total de registros, se disponível
    useEffect(() => {
        if (data?.totalResults) setTotalRows(data.totalResults);
    }, [data]);

    const options: ForeignKeyOption[] = useMemo(
        () => mapToForeignKeyOptions(data?.preview || [], referencedField),
        [data, referencedField]
    );

    // 🔹 Opção selecionada
    const selectedOption = options?.find((opt) => opt.id === value);
    const selectedLabel = selectedOption?.dados || "";

    const handleSelect = useCallback((option: ForeignKeyOption) => {
        onChange(option.id, option);
        setIsOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("", null);
    }, [onChange]);

    const handleRefresh = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        await refetch();
    }, [refetch]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        setIsOpen(prev => !prev);
        setSearch("");
        setPage(1);
    }, [disabled]);

    // 🔹 Paginação
    const handleNextPage = () => setPage(prev => prev + 1);
    const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));

    const totalPages = totalRows ? Math.ceil(totalRows / limit) : 1;

    const OptionItem = ({ option, index }: { option: ForeignKeyOption; index: number }) => (
        <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option)}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between group
                ${highlightedIndex === index ? "bg-blue-100" :
                    value === option.id ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"}`}
            role="option"
            aria-selected={value === option.id}
        >
            <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{option.dados}</div>
                <div className="text-xs text-gray-500">ID: {option.id}</div>
            </div>
            {value === option.id && <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />}
        </button>
    );

    const getStatusClasses = () => {
        if (error) return "border-red-300 ring-2 ring-red-100 bg-red-50";
        if (isOpen) return "border-blue-500 ring-2 ring-blue-100 bg-blue-50";
        if (disabled) return "border-gray-200 bg-gray-50 cursor-not-allowed";
        return "border-gray-300 hover:border-gray-400 bg-white";
    };

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            {/* Header Info */}
            <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    <Key className="w-3 h-3 mr-1" />
                    {`${referencedTable}.${referencedField}`}
                </span>
                {required && <span className="text-red-500 text-xs">*</span>}
                {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>

            {/* Botão principal */}
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${getStatusClasses()}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex-1 min-w-0">
                    {selectedLabel ? (
                        <div>
                            <span className="text-sm text-gray-900 font-medium">{selectedLabel}</span>
                            <div className="text-xs text-gray-500">ID: {value}</div>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-500">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                    {allowClear && value && !disabled && (
                        <span
                            role="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </span>
                    )}
                    <span
                        role="button"
                        onClick={handleRefresh}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* Erros */}
            {error && (
                <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </div>
            )}
            {fetchError && (
                <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Erro ao carregar dados
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[9999] backdrop-blur-sm w-full mt-2 bg-gray-800/40 border border-gray-300 rounded-xl shadow-xl"
                    style={{ maxHeight }} role="listbox">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                                <span className="text-sm text-gray-500">Carregando...</span>
                            </div>
                        ) : options.length > 0 ? (
                            options.map((opt, i) => (
                                <OptionItem key={opt.id} option={opt} index={i} />
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">Nenhum resultado</div>
                        )}
                    </div>

                    {/* Paginação */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 1 || loading}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span className="text-xs text-gray-500">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={page >= totalPages || loading}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-40"
                        >
                            Próxima <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
