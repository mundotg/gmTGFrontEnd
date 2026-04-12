"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, X, Check, Search, ShieldAlert } from "lucide-react";
import { useSession } from "@/context/SessionContext"; // Ajuste o caminho se necessário
import { isSystemTable } from "../home/tabelas/componentTabela/util";

export interface Option {
  value: string;
  label: string;
  schema?: string; // <-- Adicionado para permitir a validação do esquema
}

interface LabeledSelectProps {
  label: string;
  value: string[] | string;
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
  const { user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA DE ADMIN ---
  const isAdmin = user?.roles?.some(r => r.name === 'admin' || r.name === 'Administrador') || user?.cargo?.position === 'admin';

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
    () => {
      const values = Array.isArray(value) ? value : [value];
      return values.map(val => options.find(o => o.value === val)?.label || val);
    },
    [value, options]
  );

  // Texto do botão principal
  const displayText = useMemo(() => {
    if (selectedLabels.length === 0) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} opções selecionadas`;
  }, [selectedLabels, placeholder]);

  // Opções filtradas pela pesquisa
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
        onChange(optionValue);
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
            ${disabled
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
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden flex flex-col">
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-100 flex-shrink-0">
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
              <div className="p-2 border-b border-gray-100 flex-shrink-0">
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

                  // Analisa se a opção representa uma tabela de sistema
                  const { isSystem, reason } = isSystemTable(option.value, option.schema);
                  const isSystemAndNotAdmin = isSystem && !isAdmin;

                  // Desabilita se o limite for atingido OU se for sistema e o user não for admin
                  const isLimitReached = !isSelected && maxSelections && value.length >= maxSelections;
                  const isDisabled = isLimitReached || isSystemAndNotAdmin;

                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && handleOptionClick(option.value)}
                      disabled={!!isDisabled}
                      className={`
                        w-full flex items-center justify-between p-3 text-left transition-colors border-b border-gray-50 last:border-0
                        ${isDisabled && isSystemAndNotAdmin
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed" // Bloqueado por ser de sistema
                          : isDisabled
                            ? "text-gray-400 cursor-not-allowed opacity-60" // Bloqueado por limite
                            : isSelected
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : isSystem
                                ? "bg-amber-50/30 text-gray-700 hover:bg-amber-50" // Admin a ver opção de sistema
                                : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex flex-col flex-1 truncate pr-4">
                        <span className="flex items-center gap-2 truncate">
                          {option.label}
                          {isSystem && (
                            <ShieldAlert size={14} className={`flex-shrink-0 ${isAdmin ? 'text-amber-500' : 'text-red-400'}`} />
                          )}
                        </span>

                        {/* Mensagem de status para tabelas de sistema */}
                        {isSystem && (
                          <span className={`text-[10px] mt-0.5 truncate ${isAdmin ? 'text-amber-600 font-medium' : 'text-red-400'}`}>
                            {isAdmin ? "Sistema (Desbloqueado p/ Admin)" : `Bloqueado: ${reason}`}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
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
          {Array.isArray(value) ? value.map((val) => {
            const opt = options.find(o => o.value === val);
            const labelStr = opt?.label || val;

            // Avalia novamente para colorir a tag caso seja sistema
            const { isSystem } = isSystemTable(val, opt?.schema);

            return (
              <span
                key={val}
                className={`inline-flex items-center px-3 py-1 text-white text-sm rounded-full shadow-sm hover:shadow-md transition-shadow
                  ${isSystem
                    ? "bg-gradient-to-r from-amber-500 to-red-500" // Cor de alerta se for sistema
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                  }
                `}
              >
                <span className="truncate max-w-32">{labelStr}</span>
                <button
                  onClick={() => handleOptionClick(val)}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remover ${labelStr}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          }) : null}
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