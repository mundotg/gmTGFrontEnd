"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Search, Check, Key, RefreshCw, AlertCircle, X, Loader2 } from "lucide-react";
import { useFetch } from "../services/useFetch";
import { ForeignKeyOption, QueryResultType } from "@/types";
import { mapToForeignKeyOptions } from "@/util/func";

interface ForeignKeySelectProps {
    referencedTable: string;
    referencedField: string;
    value: string;
    onChange: (value: string, option: ForeignKeyOption | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    allowClear?: boolean;
    maxHeight?: number;
    searchPlaceholder?: string;
    isMenuOpen?: boolean;
}

export function ForeignKeySelect({
    referencedTable,
    referencedField,
    value,
    onChange,
    label = "Selecionar...",
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

    const searchRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    // Fetch data with dynamic URL based on referenced table
    const fetchConfig = useMemo(() => ({
        initialData: {} as QueryResultType,
        method: "POST" as const,
        body: {
            baseTable: referencedTable,
            select: [],
            table_list: [referencedTable],
            joins: [],
            where: [],
            limit: 100,
        },
        config: {
            withCredentials: true
        }
    }), [referencedTable]);

    const {
        data,
        loading,
        error: fetchError,
        refetch
    } = useFetch<QueryResultType>(`/exe/execute_query/`, fetchConfig);

    const options: ForeignKeyOption[] = mapToForeignKeyOptions(
        data?.preview || [],
        referencedField // aqui você passa o campo referencedField
    );

    // Filtra opções com debounce implícito
    const filteredOptions = options.filter((opt) =>
        opt.dados.toLowerCase().includes(search.toLowerCase()) ||
        opt.id.toLowerCase().includes(search.toLowerCase())
    ) || [];

    // Valor selecionado
    const selectedOption = options?.find((opt) => opt.id === value);
    const selectedLabel = selectedOption?.dados || "";
    useEffect(() => {
        if (isOpen) {
            refetch();
        }
    }, [isOpen, refetch]);


    // Auto-focus no input quando abrir
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Fechar dropdown com Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    setIsOpen(false);
                    buttonRef.current?.focus();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                        handleSelect(filteredOptions[highlightedIndex]);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, filteredOptions]);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Reset highlighted index quando a busca muda
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [search]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        setIsOpen(prev => !prev);
        setSearch("");
    }, [disabled]);

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

    // Status classes
    const getStatusClasses = () => {
        if (error) return "border-red-300 ring-2 ring-red-100 bg-red-50";
        if (isOpen) return "border-blue-500 ring-2 ring-blue-100 bg-blue-50";
        if (disabled) return "border-gray-200 bg-gray-50 cursor-not-allowed";
        return "border-gray-300 hover:border-gray-400 bg-white";
    };

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            {/* Info Badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    <Key className="w-3 h-3 mr-1" />
                    {`${referencedTable}.${referencedField}`}
                </span>
                {required && (
                    <span className="text-red-500 text-xs">*</span>
                )}
                {loading && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                )}
            </div>

            {/* Main Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${getStatusClasses()} ${disabled ? 'opacity-60' : 'hover:shadow-sm'
                    }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Selecionar ${referencedTable}`}
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
                            aria-label="Limpar seleção"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </span>
                    )}

                    <span
                        role="button"
                        onClick={handleRefresh}
                        // disabled={loading}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Atualizar opções"
                    >
                        <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </span>

                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </button>

            {/* Error Message */}
            {error && (
                <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </div>
            )}

            {/* Fetch Error */}
            {fetchError && (
                <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Erro ao carregar dados de {referencedTable}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-xl"
                    style={{ maxHeight }}
                    role="listbox"
                >
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>

                        {/* Stats */}
                        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                            <span>
                                {loading ? 'Carregando...' : `${filteredOptions.length} de ${options?.length || 0} itens`}
                            </span>
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                                <span className="text-sm text-gray-500">Carregando opções...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.id+index +"lista-dados"}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between group ${highlightedIndex === index
                                        ? "bg-blue-100"
                                        : value === option.id
                                            ? "bg-blue-50 text-blue-600"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    role="option"
                                    aria-selected={value === option.id}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm truncate">{option.dados}</div>
                                        <div className="text-xs text-gray-500">ID: {option.id}</div>
                                    </div>
                                    {value === option.id && (
                                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <div className="text-gray-400 mb-2">
                                    <Search className="w-8 h-8 mx-auto" />
                                </div>
                                <div className="text-gray-500 text-sm">
                                    {search ? `Nenhum resultado para "${search}"` : "Nenhuma opção disponível"}
                                </div>
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        Limpar busca
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {filteredOptions.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="text-xs text-gray-500 text-center">
                                Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}