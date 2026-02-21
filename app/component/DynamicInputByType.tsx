"use client";
import React, { useCallback, useMemo } from 'react';
import DatabaseDateInput from './date-input-component';
import { mapColumnTypeToDbType } from '../services';
import { tipo_db_Options } from '@/types';
import { useI18n } from '@/context/I18nContext';

interface DynamicInputProps {
  type: tipo_db_Options;
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
  SELECT = "select"
}

export default function DynamicInputByType({ type, value, onChange, placeholder, disabled, enum_values}: DynamicInputProps) {
  const { t } = useI18n();

  const input = useMemo<InputType>(() => {
    const lowerType = type.toLowerCase();
    if(enum_values && enum_values.length > 0) return InputType.SELECT;
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
    return isNaN(num) ? '' : cleaned; // mantém casas decimais do user
  }, []);

  // Classe padrão para inputs do projeto
  const baseInputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  switch (input) {
    case InputType.CHECKBOX: {
      const isNumber = typeof value === 'number';

      // Normaliza para boolean
      const normalizedValue = isNumber
        ? value === 1
        : String(value).toLowerCase() === 'true';

      const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value === 'true';

        if (isNumber) {
          onChange(selected ? '1' : '0'); // mantém 0/1
        } else {
          onChange(String(selected)); // mantém "true"/"false"
        }
      };

      return (
        <select
          disabled={disabled}
          value={normalizedValue ? 'true' : 'false'}
          onChange={handleChange}
          className={`${baseInputClasses} cursor-pointer appearance-none`}
        >
          <option value="true">{t("common.yes") || "Sim"}</option>
          <option value="false">{t("common.no") || "Não"}</option>
        </select>
      );
    }

    case InputType.DATE:
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

    case InputType.SELECT: {
      const stringValue = String(value);
      const hasValue = (stringValue && stringValue !== '');
      
      return (
        <select 
          disabled={disabled} 
          value={hasValue ? stringValue : ''} 
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClasses} cursor-pointer appearance-none`}
        >
          {/* Opção placeholder quando não há valor selecionado */}
          <option value="" disabled={hasValue ? true : undefined} className="text-gray-400">
            {placeholder || t("common.selectOption") || 'Selecione uma opção'}
          </option>
          
          {enum_values?.map((enumValue, index) => (
            <option key={`${index}-${enumValue}`} value={enumValue}>
              {enumValue}
            </option>
          ))}
        </select>
      );
    }

    case InputType.NUMBER:
      if (/float|decimal|double|numeric/.test(type)) {
        return (
          <input
            disabled={disabled}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(formatDecimal(e.target.value))}
            placeholder="0.00"
            className={baseInputClasses}
          />
        );
      }

      return (
        <input
          disabled={disabled}
          type="number"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        />
      );

    case InputType.TEXT:
    default:
      return (
        <input
          disabled={disabled}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t("common.typeValue") || 'Digite um valor'}
          className={baseInputClasses}
          maxLength={type.includes('char') ? 255 : undefined}
        />
      );
  }
}