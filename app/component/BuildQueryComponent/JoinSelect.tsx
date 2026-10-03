"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

interface Option {
  value: string;
  label: string;
}

interface JoinSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (Option | string)[] | Map<string, string>;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionRenderer?: (option: Option, isSelected: boolean) => React.ReactNode;
  autoWidth?: boolean;
}

interface DropdownPosition {
  placement: "bottom" | "top";
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const JoinSelectComponent: React.FC<JoinSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  searchable = true,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  optionRenderer,
  autoWidth = true,
}) => {
  const { t } = useI18n();
  const defaultPlaceholder = placeholder || t("common.selectOption") || "Selecione uma opção";

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    placement: "bottom",
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedOptions: Option[] = useMemo(() => {
    // Caso 1: Map<string, string>
    if (options instanceof Map) {
      return Array.from(options.entries()).map(([name, id]) => ({
        value: id,
        label: name,
      }));
    }

    // Caso 2: Array de string | Option
    if (Array.isArray(options)) {
      return options.map(opt =>
        typeof opt === "string"
          ? { value: opt, label: opt }
          : opt
      );
    }

    return [];
  }, [options]);

  const isFullWidth = useMemo(() => {
    return !autoWidth || className.includes("w-full") || buttonClassName.includes("w-full");
  }, [autoWidth, className, buttonClassName]);

  // Calcula a posição do dropdown garantindo que fique exatamente no lugar certo
  const calculateDropdownPosition = useCallback(() => {
    if (typeof window === "undefined" || !buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Se o elemento foi rolado para fora da tela visível, fecha
    if (buttonRect.bottom < 0 || buttonRect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - buttonRect.bottom - 8;
    const spaceAbove = buttonRect.top - 8;

    // Decide se abre para baixo ou para cima
    const shouldOpenDown = spaceBelow >= 180 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(320, Math.max(120, shouldOpenDown ? spaceBelow : spaceAbove));

    // Determina a largura do dropdown de acordo com a responsividade
    let width: number;
    if (isFullWidth) {
      width = Math.min(buttonRect.width, viewportWidth - 20);
    } else {
      width = Math.min(Math.max(buttonRect.width, 140), viewportWidth - 20);
    }

    // Ajusta horizontalmente para não ultrapassar as bordas da tela
    let left = buttonRect.left;
    if (left + width > viewportWidth - 10) {
      left = Math.max(10, viewportWidth - width - 10);
    }
    if (left < 10) {
      left = 10;
    }

    if (shouldOpenDown) {
      setDropdownPosition({
        placement: "bottom",
        top: buttonRect.bottom + 4,
        left,
        width,
        maxHeight,
      });
    } else {
      setDropdownPosition({
        placement: "top",
        bottom: viewportHeight - buttonRect.top + 4,
        left,
        width,
        maxHeight,
      });
    }
  }, [isFullWidth]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleScroll = () => {
      calculateDropdownPosition();
    };

    const handleResize = () => {
      calculateDropdownPosition();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, calculateDropdownPosition]);

  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const displayText = useMemo(() => {
    const selectedOption = normalizedOptions.find(opt => opt.value === value);
    if (!value) return defaultPlaceholder;
    return selectedOption?.label ?? value;
  }, [value, defaultPlaceholder, normalizedOptions]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return normalizedOptions;
    const lower = searchTerm.toLowerCase();
    return normalizedOptions.filter(opt => opt.label.toLowerCase().includes(lower));
  }, [searchTerm, normalizedOptions]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      if (!isOpen) {
        calculateDropdownPosition();
      }
      setIsOpen(prev => !prev);
      setSearchTerm("");
    }
  }, [disabled, isOpen, calculateDropdownPosition]);

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
      <div className={`relative min-w-0 ${isFullWidth ? "w-full block" : "inline-block"} ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            flex items-center justify-between min-w-0
            rounded-lg transition-all duration-200 text-sm px-3 py-2
            border focus:outline-none focus:ring-2 focus:ring-blue-500/50
            ${disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400 opacity-70"
              : isOpen
                ? "border-blue-500 shadow-sm bg-white ring-2 ring-blue-500/20"
                : "border-gray-200 hover:bg-gray-50 bg-gray-50"}
            ${value ? "text-gray-900 font-medium" : "text-gray-500"}
            ${isFullWidth ? "w-full" : "w-auto min-w-[120px]"}
            ${buttonClassName}
          `}
          role="combobox"
          aria-expanded={isOpen}
          aria-label={defaultPlaceholder}
          aria-controls="dropdown-options"
        >
          <span className="flex-1 min-w-0 truncate max-w-full text-left" title={displayText}>
            {displayText}
          </span>
          <ChevronDown
            className={`ml-2 h-4 w-4 shrink-0 transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Dropdown via React Portal (resolve overflow/modal clipping e posicionamento incorreto) */}
      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          className={`
            fixed z-[99999] bg-white border border-gray-200 rounded-xl shadow-2xl
            overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100
            ${dropdownClassName}
          `}
          style={{
            position: "fixed",
            zIndex: 99999,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxWidth: "calc(100vw - 20px)",
            maxHeight: `${dropdownPosition.maxHeight}px`,
            ...(dropdownPosition.placement === "bottom"
              ? { top: `${dropdownPosition.top}px` }
              : { bottom: `${dropdownPosition.bottom}px` }),
          }}
          role="listbox"
          id="dropdown-options"
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("common.search") || "Buscar..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                        bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs sm:text-sm font-medium">
                {searchTerm 
                  ? (t("common.noOptionFound") || "Nenhuma opção encontrada") 
                  : (t("common.noOptionAvailable") || "Nenhuma opção disponível")}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={`${option.value}-${index}`}
                    onClick={() => handleOptionClick(option.value)}
                    className={`
                      w-full flex items-center px-3 py-2 text-xs sm:text-sm text-left rounded-lg
                      transition-colors duration-150 mb-0.5 last:mb-0 min-w-0
                      ${isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-gray-100 font-medium"}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {optionRenderer ? optionRenderer(option, isSelected) : (
                      <span className="truncate w-full block" title={option.label}>
                        {option.label}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const JoinSelect = React.memo(JoinSelectComponent);