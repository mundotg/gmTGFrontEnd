'use client';
import React from 'react';
import DatabaseDateInput from './date-input-component';
import { mapColumnTypeToDbType } from '../services';

interface DynamicInputProps {
  type: string;
  value: string | number | boolean;
  operator?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function DynamicInputByType({ type, value, onChange, placeholder, disabled }: DynamicInputProps) {
  const inputType = getInputType(type);

  const formatDecimal = (val: string): string => {
    const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  switch (inputType) {
    case 'checkbox':
      const isNamber = typeof value === 'number';
      return (
        <select
          value={isNamber ? value === 1 ? 'true' : 'false' : String(value) ? 'true' : 'false'}
          onChange={(e) => onChange(isNamber ? (e.target.value === 'true' ? "1" : "0") : String(e.target.value === 'true'))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Selecione --</option>
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      );

    case 'date':
      return (
        <DatabaseDateInput
          label=""
          name=""
          dbType={mapColumnTypeToDbType(type)}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          displayFormat="YYYY-MM-DD"
        />
      );

    case 'number':
      if (/float|decimal|double|numeric/.test(type)) {
        return (
          <input
          disabled={disabled}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(formatDecimal(e.target.value))}
            placeholder="0.00"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      }

      return (
        <input
        disabled={disabled}
          type="number"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );

    default:
      return (
        <input
        disabled={disabled}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Digite um valor'}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={type.includes('char') ? 255 : undefined}
        />
      );
  }
}

// Detecta o tipo de input baseado no tipo SQL
function getInputType(type: string): 'text' | 'number' | 'date' | 'checkbox' {
  const lowerType = type.toLowerCase();

  if (/boolean|tinyint\(1\)|bit|bool/.test(lowerType)) return 'checkbox';
  if (/int/.test(lowerType) && !/float|decimal/.test(lowerType)) return 'number';
  if (/float|double|decimal|numeric/.test(lowerType)) return 'number';
  if (/date|timestamp|datetime/.test(lowerType)) return 'date';
  if (/char|text|string/.test(lowerType)) return 'text';

  return 'text';
}
