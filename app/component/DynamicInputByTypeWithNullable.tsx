'use client';
import React, { useCallback, useMemo } from 'react';
import DatabaseDateInput from './date-input-component';
import { mapColumnTypeToDbType } from '../services';
import { tipo_db_Options } from '@/types';

interface DynamicInputProps {
  type: tipo_db_Options;
  is_nullable: boolean;
  value: string | number | boolean;
  enum_values?: string[];
  operator?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

enum InputType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  CHECKBOX = 'checkbox',
  SELECT = 'select'
}

export default function DynamicInputByTypeWithNullable({
  type,
  value,
  onChange,
  placeholder,
  disabled,
  enum_values,
  is_nullable
}: DynamicInputProps) {

  const input = useMemo<InputType>(() => {
    const lowerType = type.toLowerCase();
    if (enum_values && enum_values.length > 0) return InputType.SELECT;
    if (/boolean|tinyint\(1\)|bit|bool/.test(lowerType)) return InputType.CHECKBOX;
    if (/int/.test(lowerType) && !/float|decimal/.test(lowerType)) return InputType.NUMBER;
    if (/float|double|decimal|numeric/.test(lowerType)) return InputType.NUMBER;
    if (/date|timestamp|datetime/.test(lowerType)) return InputType.DATE;
    if (/char|text|string/.test(lowerType)) return InputType.TEXT;
    return InputType.TEXT;
  }, [type, enum_values]);

  const formatDecimal = useCallback((val: string): string => {
    const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? '' : cleaned;
  }, []);

  /** 🧹 Permite limpar valor quando o campo for nulo */
  const renderNullableOption = (currentValue: string | number | boolean) => {
    if (!is_nullable) return null;
    const isEmpty = currentValue === '' || currentValue === null || currentValue === undefined;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('')}
        className={`text-xs text-gray-500 ml-2 underline hover:text-blue-600 ${isEmpty ? 'opacity-50' : ''}`}
      >
        NULL
      </button>
    );
  };

  switch (input) {
    case InputType.CHECKBOX: {
      const isNumber = typeof value === 'number';
      const normalizedValue = isNumber
        ? value === 1
        : String(value).toLowerCase() === 'true';

      const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value === 'true';
        if (isNumber) onChange(selected ? '1' : '0');
        else onChange(String(selected));
      };

      return (
        <div className="flex items-center">
          <select
            disabled={disabled}
            value={normalizedValue ? 'true' : 'false'}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          {renderNullableOption(value)}
        </div>
      );
    }

    case InputType.DATE:
      return (
        <div className="flex items-center">
          <DatabaseDateInput
            label=""
            name=""
            dbType={mapColumnTypeToDbType(type)}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            displayFormat="YYYY-MM-DD"
          />
          {renderNullableOption(value)}
        </div>
      );

    case InputType.SELECT: {
      const stringValue = String(value);
      const hasValue = stringValue && stringValue !== '';
      return (
        <div className="flex items-center w-full">
          <select
            disabled={disabled}
            value={hasValue ? stringValue : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled={hasValue ? true : undefined}>
              {placeholder || 'Selecione uma opção'}
            </option>
            {enum_values?.map((enumValue, index) => (
              <option key={`${index}-${enumValue}`} value={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
          {renderNullableOption(value)}
        </div>
      );
    }

    case InputType.NUMBER:
      if (/float|decimal|double|numeric/.test(type)) {
        return (
          <div className="flex items-center">
            <input
              disabled={disabled}
              type="text"
              value={String(value)}
              onChange={(e) => onChange(formatDecimal(e.target.value))}
              placeholder="0.00"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {renderNullableOption(value)}
          </div>
        );
      }

      return (
        <div className="flex items-center">
          <input
            disabled={disabled}
            type="number"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {renderNullableOption(value)}
        </div>
      );

    case InputType.TEXT:
    default:
      return (
        <div className="flex items-center">
          <input
            disabled={disabled}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Digite um valor'}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={type.includes('char') ? 255 : undefined}
          />
          {renderNullableOption(value)}
        </div>
      );
  }
}
