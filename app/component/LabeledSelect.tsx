
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, X, Check, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps {
  label: string;
  value: string[];
  onChange: (value: string) => Promise<void>;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  searchable?: boolean;
}

const LabeledSelectComponent: React.FC<LabeledSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma ou mais opções",
  disabled = false,
  maxSelections,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  // Labels selecionados
  const selectedLabels = useMemo(
    () => value.map(val => options.find(o => o.value === val)?.label || val),
    [value, options]
  );

  // Texto do botão
  const displayText = useMemo(() => {
    if (selectedLabels.length === 0) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} opções selecionadas`;
  }, [selectedLabels, placeholder]);

  // Opções filtradas
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lower));
  }, [searchTerm, options]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
      setSearchTerm("");
    }
  }, [disabled]);

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      const isSelected = value.includes(optionValue);
      if (isSelected) {
        onChange(optionValue);
      } else if (!maxSelections || value.length < maxSelections) {
        onChange( optionValue);
      }
    },
    [value, onChange, maxSelections]
  );

  const handleClearAll = useCallback(() => onChange(""), [onChange]);

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
        {maxSelections && (
          <span className="text-xs font-normal text-gray-500 ml-1">
            (máx. {maxSelections})
          </span>
        )}
      </label>

      {/* Main Select Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between p-3 
            border-2 rounded-xl transition-all duration-200
            ${
              disabled
                ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                : isOpen
                ? "border-blue-500 shadow-lg ring-4 ring-blue-500/10"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }
            ${selectedLabels.length > 0 ? "text-gray-900" : "text-gray-500"}
          `}
        >
          <span className="truncate text-left">{displayText}</span>
          <ChevronDown
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar opções..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Clear All Button */}
            {value.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <button
                  onClick={handleClearAll}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Limpar todas as seleções
                </button>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? "Nenhuma opção encontrada" : "Nenhuma opção disponível"}
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = value.includes(option.value);
                  const isDisabled =
                    !isSelected && maxSelections && value.length >= maxSelections;

                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && handleOptionClick(option.value)}
                      disabled={!!isDisabled}
                      className={`
                        w-full flex items-center justify-between p-3 text-left transition-colors
                        ${
                          isDisabled
                            ? "text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tags */}
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedLabels.map((lbl, index) => (
            <span
              key={value[index]}
              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="truncate max-w-32">{lbl}</span>
              <button
                onClick={() => handleOptionClick(value[index])}
                className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remover ${lbl}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selection Counter */}
      {maxSelections && (
        <div className="mt-2 text-xs text-gray-500">
          {value.length} de {maxSelections} selecionados
        </div>
      )}
    </div>
  );
};

export const LabeledSelect = React.memo(LabeledSelectComponent);
