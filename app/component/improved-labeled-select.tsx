import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps {
  label: string;
  value: string[];
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  searchable?: boolean;
}

export const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione uma ou mais opções',
  disabled = false,
  maxSelections,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleOptionClick = (optionValue: string) => {
    
      if (!maxSelections || value.length < maxSelections) {
        onChange(optionValue);
      }
    
  };

 

  const handleClearAll = () => {
    onChange("");
  };

  const selectedLabels = value.map(val => 
    options.find(o => o.value === val)?.label || val
  );

  const displayText = selectedLabels.length > 0 
    ? selectedLabels.length === 1 
      ? selectedLabels[0]
      : `${selectedLabels.length} opções selecionadas`
    : placeholder;

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
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400' 
              : isOpen
                ? 'border-blue-500 shadow-lg ring-4 ring-blue-500/10'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }
            ${selectedLabels.length > 0 ? 'text-gray-900' : 'text-gray-500'}
          `}
        >
          <span className="truncate text-left">{displayText}</span>
          <ChevronDown 
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 
              ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar opções..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                  {searchTerm ? 'Nenhuma opção encontrada' : 'Nenhuma opção disponível'}
                </div>
              ) : (
                filteredOptions.map((option,index) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled = !isSelected && maxSelections && value.length >= maxSelections;
                  
                  return (
                    <button
                      key={option.value+index+"option"}
                      onClick={() => !isDisabled && handleOptionClick(option.value)}
                      disabled={isDisabled || false}
                      className={`
                        w-full flex items-center justify-between p-3 text-left transition-colors
                        ${isDisabled 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'text-gray-700 hover:bg-gray-50'
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
          {selectedLabels.map((label, index) => (
            <span
              key={value[index]+index+"selected"}
              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="truncate max-w-32">{label}</span>
              <button
                onClick={() => handleOptionClick(value[index])}
                className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remover ${label}`}
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


export default LabeledSelect;