'use client';
import React, { useEffect, useState } from 'react';
import { DatabaseType, DisplayFormat } from '@/types';
import { formatDisplay, getDatabaseFormattedValue, getHTMLInputType } from '@/util/func';
interface ChangeEventCustom {
  target: { name: string; value: string };
  isValid: boolean;
  rawValue: string;
  databaseValue: string | number | null;
  databaseType: DatabaseType;
}

interface Props {
  value?: string;
  onChange?: (e: ChangeEventCustom) => void;
  dbType?: DatabaseType;
  displayFormat?: DisplayFormat;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}



const DatabaseDateInput: React.FC<Props> = ({
  value = '',
  onChange,
  dbType = DatabaseType.DATE,
  displayFormat = 'YYYY-MM-DD',
  label = 'Data',
  required = false,
  placeholder = '',
  className = '',
  disabled = false,
  name = '',
  minDate,
  maxDate
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          const iso = local.toISOString();

          switch (getHTMLInputType(dbType)) {
            case 'datetime-local':
              setInputValue(iso.slice(0, 16));
              break;
            case 'date':
              setInputValue(iso.slice(0, 10));
              break;
            default:
              setInputValue(value);
          }
        } else {
          setInputValue(value); // Para TEXT/VARCHAR ou formato inválido
        }
      } catch {
        setInputValue(value);
      }
    }
  }, [value, dbType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    let parsedDate: Date | null = null;
    let currentError = '';

    if (dbType === DatabaseType.VARCHAR || dbType === DatabaseType.TEXT) {
      parsedDate = null;
      currentError = required && !raw ? 'Campo obrigatório' : '';
    } else {
      try {
        parsedDate = new Date(raw);
        if (!raw && required) {
          currentError = 'Campo obrigatório';
        } else if (isNaN(parsedDate.getTime())) {
          currentError = 'Data inválida';
        } else {
          const min = minDate ? new Date(minDate) : null;
          const max = maxDate ? new Date(maxDate) : null;

          if (min && parsedDate < min) {
            currentError = `Data mínima: ${formatDisplay(min, displayFormat)}`;
          } else if (max && parsedDate > max) {
            currentError = `Data máxima: ${formatDisplay(max, displayFormat)}`;
          }
        }
      } catch {
        currentError = 'Data inválida';
      }
    }

    setError(currentError);

    if (onChange) {
      onChange({
        target: { name, value: raw },
        isValid: currentError === '',
        rawValue: raw,
        databaseValue: getDatabaseFormattedValue(raw, dbType),
        databaseType: dbType
      });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={getHTMLInputType(dbType)}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder || displayFormat}
        disabled={disabled}
        min={minDate ? String(minDate) : undefined}
        max={maxDate ? String(maxDate) : undefined}
        className={`w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />

      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export default DatabaseDateInput;
