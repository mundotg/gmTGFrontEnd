import React, { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps2 {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  allowCustomNumber?: boolean;
  maxCustomNumber?: number;
}

export const LabeledSelect2: React.FC<LabeledSelectProps2> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '-- Selecione uma opção --',
  allowCustomNumber = true,
  maxCustomNumber = 5000,
}) => {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'custom') {
      setIsCustomInput(true);
      setCustomValue(value && !isNaN(Number(value)) ? value : '');
    } else {
      setIsCustomInput(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permite apenas números e backspace
    if (inputValue === '' || /^\d+$/.test(inputValue)) {
      setCustomValue(inputValue);
      
      // Valida se o número é menor que o máximo permitido
      const numericValue = parseInt(inputValue, 10);
      if (inputValue === '' || (numericValue <= maxCustomNumber)) {
        onChange(inputValue);
      }
    }
  };

  const handleCustomInputBlur = () => {
    if (customValue === '') {
      setIsCustomInput(false);
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsCustomInput(false);
      setCustomValue('');
      onChange('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {isCustomInput ? (
        <div className="relative">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomInputChange}
            onBlur={handleCustomInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={`Digite um número ≤ ${maxCustomNumber}`}
            className="w-full p-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            ≤ {maxCustomNumber}
          </div>
        </div>
      ) : (
        <select
          value={value && !options.some(opt => opt.value === value) ? 'custom' : value}
          onChange={handleSelectChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {allowCustomNumber && (
            <option value="custom">
              ✏️ Digitar número personalizado...
            </option>
          )}
        </select>
      )}
      
      {/* Mensagem de validação */}
      {customValue && parseInt(customValue, 10) > maxCustomNumber && (
        <p className="text-red-500 text-sm mt-1">
          O número deve ser menor ou igual a {maxCustomNumber}
        </p>
      )}
    </div>
  );
};