// components/JoinSelect.tsx
"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2, ChevronDown } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface JoinSelectProps {
    value: string;
    onChange: (value: string) => void;
    fetchOptions: (page: number, search: string) => Promise<{
        options: Option[];
        hasMore: boolean;
        total?: number;
    }>;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    optionRenderer?: (option: Option, isSelected: boolean) => React.ReactNode;
    autoWidth?: boolean;
    debounceMs?: number;
    pageSize?: number;
}

const JoinSelectComponent: React.FC<JoinSelectProps> = ({
    value,
    onChange,
    fetchOptions,
    // required = false,
    placeholder = "Selecione uma opção",
    disabled = false,
    searchable = true,
    className = "",
    buttonClassName = "",
    dropdownClassName = "",
    optionRenderer,
    autoWidth = true,
    debounceMs = 300,
    // pageSize = 5,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Debounce search term
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on new search
        }, debounceMs);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchTerm, debounceMs]);

    // Fetch options when search term changes or modal opens
    useEffect(() => {
        // if (!isOpen) return;
        if(loading) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await fetchOptions(1, debouncedSearch);
                setOptions(result.options);
                setHasMore(result.hasMore);
                setTotal(result.total || 0);
                setCurrentPage(1);
            } catch (error) {
                console.error("Erro ao buscar opções:", error);
                setOptions([]);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ debouncedSearch]);

    // Load more data when scrolling
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const result = await fetchOptions(nextPage, debouncedSearch);

            setOptions(prev => [...prev, ...result.options]);
            setHasMore(result.hasMore);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error("Erro ao carregar mais opções:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [currentPage, debouncedSearch, fetchOptions, hasMore, loadingMore]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!isOpen || !hasMore || loadingMore) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [isOpen, hasMore, loadingMore]);

    // Calcula a posição do dropdown
    const calculateDropdownPosition = useCallback(() => {
        if (typeof window === "undefined") return;
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let top = buttonRect.bottom + window.scrollY + 4;
            let left = buttonRect.left + window.scrollX;
            const width = autoWidth ? Math.max(buttonRect.width, 200) : buttonRect.width;

            // Verifica se há espaço suficiente embaixo
            const dropdownHeight = 320;
            if (buttonRect.bottom + dropdownHeight > viewportHeight) {
                top = buttonRect.top + window.scrollY - dropdownHeight - 4;
            }

            // Ajusta horizontalmente se sair da viewport
            if (left + width > viewportWidth) {
                left = viewportWidth - width - 10;
            }

            setDropdownPosition({ top, left, width });
        }
    }, [autoWidth]);

    // Event listeners
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                calculateDropdownPosition();
            }
        };

        const handleResize = () => {
            if (isOpen) {
                calculateDropdownPosition();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen, calculateDropdownPosition]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchable) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, searchable]);

    // Recalculate position when opened
    useEffect(() => {
        if (isOpen) {
            calculateDropdownPosition();
        }
    }, [isOpen, calculateDropdownPosition]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setDebouncedSearch("");
            setCurrentPage(1);
        }
    }, [isOpen]);

    const displayText = useMemo(() => {
        if (!value) return placeholder;

        // Try to find in current options first
        const selectedOption = options.find(opt => opt.value === value);
        if (selectedOption) return selectedOption.label;

        // If not found, it might be from a previous search, show value as fallback
        return value;
    }, [value, placeholder, options]);

    const handleToggle = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev);
            setSearchTerm("");
        }
    }, [disabled]);

    const handleOptionClick = useCallback(
        (optionValue: string) => {
            onChange(optionValue);
            setIsOpen(false);
            setSearchTerm("");
        },
        [onChange]
    );

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // Status text for dropdown
    const getStatusText = useCallback(() => {
        if (loading) return "Carregando...";
        if (options.length === 0) return searchTerm ? "Nenhuma opção encontrada" : "Nenhuma opção disponível";
        if (total > 0) return `${options.length} de ${total} opções`;
        return `${options.length} opções`;
    }, [loading, options.length, searchTerm, total]);

    return (
        <>
            <div className={`${className} relative inline-block`}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggle}
                    disabled={disabled}
                    className={`
                        inline-flex items-center justify-between
                        rounded-md transition-all duration-200 text-sm px-3 py-2
                        border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${disabled
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                            : isOpen
                                ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20 bg-white"
                                : "border-gray-300 hover:border-gray-400 hover:shadow-sm bg-white"}
                        ${value ? "text-gray-900" : "text-gray-500"}
                        ${autoWidth ? "w-auto min-w-[160px]" : "w-full"}
                        ${buttonClassName}
                    `}
                    arial-role="combobox"
                    aria-expanded={isOpen}
                    aria-label={placeholder}
                >
                    <span className="flex-1 truncate text-left mr-2" title={displayText}>
                        {displayText}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* Floating dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`
                        fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl
                        max-h-80 overflow-hidden flex flex-col
                        animate-in fade-in-0 zoom-in-95 duration-100
                        ${dropdownClassName}
                    `}
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: autoWidth ? 'max-content' : `${dropdownPosition.width}px`,
                        minWidth: `${Math.min(dropdownPosition.width, 200)}px`,
                    }}
                    role="listbox"
                >
                    {/* Search input */}
                    {searchable && (
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm 
                                             focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                                             bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Status info */}
                    <div className="px-3 py-1 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">
                            {getStatusText()}
                        </p>
                    </div>

                    {/* Options list */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && options.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">Carregando...</span>
                            </div>
                        ) : options.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                {getStatusText()}
                            </div>
                        ) : (
                            <>
                                {options.map((option, index) => {
                                    const isSelected = value === option.value;
                                    return (
                                        <button
                                            key={`${option.value}-${index}`}
                                            onClick={() => handleOptionClick(option.value)}
                                            className={`
                                                w-full flex items-center px-3 py-2 text-sm text-left 
                                                transition-colors duration-150 border-b border-gray-50
                                                hover:bg-blue-50 hover:text-blue-700
                                                ${isSelected
                                                    ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500"
                                                    : "text-gray-700"}
                                            `}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            {optionRenderer ? optionRenderer(option, isSelected) : (
                                                <span className="truncate flex-1">
                                                    {option.label}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Load more trigger */}
                                {hasMore && (
                                    <div ref={loadMoreRef} className="flex justify-center py-2">
                                        {loadingMore ? (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Carregando mais...
                                            </div>
                                        ) : (
                                            <div className="h-4" /> // Spacer for intersection observer
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export const SelectComp = React.memo(JoinSelectComponent);