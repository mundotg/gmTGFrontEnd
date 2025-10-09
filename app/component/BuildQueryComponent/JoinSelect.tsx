// components/JoinSelect.tsx
"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface JoinSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: (Option | string)[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    optionRenderer?: (option: Option, isSelected: boolean) => React.ReactNode;
    autoWidth?: boolean;
}

const JoinSelectComponent: React.FC<JoinSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Selecione uma opção",
    disabled = false,
    searchable = true,
    className = "",
    buttonClassName = "",
    dropdownClassName = "",
    optionRenderer,
    autoWidth = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const normalizedOptions: Option[] = useMemo(
        () =>
            options.map(opt =>
                typeof opt === "string" ? { value: opt, label: opt } : opt
            ),
        [options]
    );

    // Calcula a posição do dropdown
    const calculateDropdownPosition = useCallback(() => {
        if (typeof window === "undefined") return; // Verifica se está no ambiente do navegador
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let top = buttonRect.bottom + window.scrollY + 4; // 4px de margem
            let left = buttonRect.left + window.scrollX;
            const width = autoWidth ? Math.max(buttonRect.width, 120) : buttonRect.width;

            // Verifica se há espaço suficiente embaixo
            const dropdownHeight = 320; // altura máxima estimada
            if (buttonRect.bottom + dropdownHeight > viewportHeight) {
                // Posiciona acima se não há espaço embaixo
                top = buttonRect.top + window.scrollY - dropdownHeight - 4;
            }

            // Ajusta horizontalmente se sair da viewport
            if (left + width > viewportWidth) {
                left = viewportWidth - width - 10;
            }

            setDropdownPosition({ top, left, width });
        }
    }, [autoWidth]);

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

    useEffect(() => {
        if (isOpen && searchable) {
            searchInputRef.current?.focus();
        }
    }, [isOpen, searchable]);

    useEffect(() => {
        if (isOpen) {
            calculateDropdownPosition();
        }
    }, [isOpen, calculateDropdownPosition]);

    const displayText = useMemo(() => {
        const selectedOption = normalizedOptions.find(opt => opt.value === value);
        if (!value) return placeholder;
        return selectedOption?.label ?? value;
    }, [value, placeholder, normalizedOptions]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        const lower = searchTerm.toLowerCase();
        return normalizedOptions.filter(opt => opt.label.toLowerCase().includes(lower));
    }, [searchTerm, normalizedOptions]);

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
                        rounded-md transition-all duration-200 text-sm px-2 py-1
                        border focus:outline-none focus:ring-2
                        ${disabled
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                            : isOpen
                                ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20 bg-white"
                                : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"}
                        ${value ? "text-gray-900" : "text-gray-500"}
                        ${autoWidth ? "w-auto min-w-[120px]" : "w-full"}
                        ${buttonClassName}
                    `}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-label={placeholder}
                    aria-controls="dropdown-options"  // 👈 adiciona referência
                >
                    <span className="flex-1 truncate max-w-full" title={displayText}>
                        {displayText}
                    </span>
                    <svg
                        className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Portal-like dropdown floating */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`
                        fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl
                        max-h-80 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100
                        ${dropdownClassName}
                    `}
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: autoWidth ? 'max-content' : `${dropdownPosition.width}px`,
                        minWidth: `${Math.min(dropdownPosition.width, 120)}px`,
                    }}
                    role="listbox"
                >
                    {searchable && (
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm 
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             bg-white"
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                {searchTerm ? "Nenhuma opção encontrada" : "Nenhuma opção disponível"}
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const isSelected = value === option.value;
                                return (
                                    <button
                                        key={`${option.value}-${index}`}
                                        onClick={() => handleOptionClick(option.value)}
                                        className={`
                                            w-full flex items-center px-4 py-2.5 text-sm text-left 
                                            transition-colors duration-150 hover:bg-gray-50
                                            ${isSelected
                                                ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500"
                                                : "text-gray-700"}
                                        `}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        {optionRenderer ? optionRenderer(option, isSelected) : (
                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export const JoinSelect = React.memo(JoinSelectComponent);